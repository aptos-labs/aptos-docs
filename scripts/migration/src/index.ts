import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxFromMarkdown, mdxToMarkdown } from "mdast-util-mdx";
import { mdxJsxToMarkdown } from "mdast-util-mdx-jsx";
import { mdxjs } from "micromark-extension-mdxjs";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { frontmatter } from "micromark-extension-frontmatter";
import { frontmatterFromMarkdown, frontmatterToMarkdown } from "mdast-util-frontmatter";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { logger } from "./utils/logger.js";
import { progress } from "./utils/progress.js";
import { downloadWithProgress } from "./utils/download.js";
import extract from "extract-zip";

import { CalloutTransformer } from "./transformers/callout.js";
import { TitleTransformer } from "./transformers/title.js";
import { ImportTransformer } from "./transformers/import.js";
import { HrefTransformer } from "./transformers/href.js";
import { FrontmatterTransformer } from "./transformers/frontmatter.js";
import { CardsTransformer } from "./transformers/cards.js";
import { LinkCardTransformer } from "./transformers/linkCard.js";
import { TabsTransformer } from "./transformers/tabs.js";
import { StepsTransformer } from "./transformers/steps.js";
import { FileTreeTransformer } from "./transformers/fileTree.js";
import { CustomComponentTransformer } from "./transformers/custom-components.js";
import { CodeTransformer } from "./transformers/code.js";
import { ImageTransformer } from "./transformers/image.js";
import { PunctuationTransformer } from "./transformers/punctuation.js";
import type { TransformerOptions } from "./types/index.js";

interface ExtendedTransformerOptions extends TransformerOptions {
  sourcePath: string; // Make sourcePath required
  language?: string; // Add language option for determining output path
}

import type { Handle, State } from "mdast-util-to-markdown";

interface MigrationConfig {
  ignoredFolders: string[];
  useComponentSyntax: boolean;
  shouldSkipFile: (relativePath: string) => boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");

async function processFile(filePath: string, options: ExtendedTransformerOptions): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8");

  // Parse MDX content into AST
  const ast = fromMarkdown(content, {
    extensions: [mdxjs(), directive(), frontmatter(["yaml"]), gfmTable()],
    mdastExtensions: [
      mdxFromMarkdown(),
      directiveFromMarkdown(),
      frontmatterFromMarkdown(["yaml"]),
      gfmTableFromMarkdown(),
    ],
  });

  // Log the AST structure for debugging
  logger.log("Migration", "Processing AST for file:", filePath);
  logger.log(
    "Migration",
    "AST structure:",
    JSON.stringify(
      ast,
      (key, value) => {
        // Filter out some noisy properties
        if (key === "position" || key === "data") return undefined;
        return value;
      },
      2,
    ),
  );

  // Add filePath and ensure sourcePath for transformers
  const transformerOptions: ExtendedTransformerOptions = {
    ...options,
    filePath,
    sourcePath: options.sourcePath,
  };

  // Create component transformers first so we can get their mappings
  const componentTransformers = [
    new CardsTransformer(),
    new LinkCardTransformer(),
    new TabsTransformer(),
    new StepsTransformer(),
    new FileTreeTransformer(),
  ];

  // Get all component mappings
  const componentMappings = new Map<string, string>();
  componentTransformers.forEach((transformer) => {
    const map = transformer.getComponentMap();
    map.forEach((targetComp: string, sourceComp: string) => {
      componentMappings.set(sourceComp, targetComp);
    });
  });

  // Create all transformers in order
  const transformers = [
    new TitleTransformer(),
    new FrontmatterTransformer(),
    new CustomComponentTransformer(),
    new CalloutTransformer(),
    new CodeTransformer(),
    ...componentTransformers,
    new HrefTransformer(),
    new ImageTransformer(),
    new PunctuationTransformer(),
    new ImportTransformer(componentMappings), // Run last to see all components
  ];

  logger.log("Migration", "Starting transformers");
  progress.updateTransformer("Starting...");

  for (const transformer of transformers) {
    const name = transformer.constructor.name;
    logger.log("Migration", "Running transformer:", name);
    progress.updateTransformer(name);
    transformer.transform(ast, transformerOptions);
  }

  logger.log("Migration", "Finished all transformers");

  // Convert AST back to MDX
  const defaultMdxJsxFlowElement = mdxJsxToMarkdown().handlers?.mdxJsxFlowElement;
  if (!defaultMdxJsxFlowElement) {
    throw new Error("Default handler for mdxJsxFlowElement not found");
  }

  const newContent = toMarkdown(ast, {
    extensions: [
      mdxToMarkdown(),
      directiveToMarkdown(),
      frontmatterToMarkdown(["yaml"]),
      gfmTableToMarkdown(),
    ],
    bullet: "-",
    listItemIndent: "one",
    tightDefinitions: false,
    fences: true,
    emphasis: "_",
    strong: "*",
    handlers: {
      // Custom handler to preserve escaped characters in Strong nodes
      strong: ((node, _parent, context) => {
        const exit = context.enter("strong");
        const value = node.children
          .map((child: any) => {
            if (child.type === "text" && (child.value === "{" || child.value === "}")) {
              return "\\" + child.value;
            }
            return context.handle(child, node, context, {
              before: "",
              after: "",
              now: { line: 1, column: 1 },
              lineShift: 0,
            });
          })
          .join("");
        exit();
        return `**${value}**`;
      }) as Handle,

      // Custom handler to preserve html entities and escaped characters in Text nodes
      text: ((node) => {
        let text = node.value;

        // Step 1: Handle HTML entities
        text = text.replace(/[&<>'"]/g, (match: string) => {
          const entities: { [key: string]: string } = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&apos;",
            '"': "&quot;",
          };
          return entities[match];
        });

        // Step 2: Preserve escaped characters
        text = text.replace(/\\([{}\\])/g, (match: string, char: string) => {
          return "\\" + char;
        });

        return text;
      }) as Handle,

      mdxJsxFlowElement: (node, parent, context, info) => {
        if (node.name === "FileTree" || node.name === "Steps") {
          const exit = context.enter("mdxJsxFlowElement");
          const nodeContent = node.children
            .map((child: any) =>
              context.handle(child, node, context, {
                after: "",
                before: "",
                lineShift: 0,
                now: { line: 1, column: 1 },
              }),
            )
            .join("\n");
          exit();
          return `<${node.name}>\n\n${nodeContent}\n\n</${node.name}>`;
        }

        return defaultMdxJsxFlowElement(node, parent, context, info);
      },
    },
  });

  // Calculate the new file path
  if (!options.sourcePath) {
    throw new Error("Source path not provided in options");
  }
  const relativePath = path.relative(options.sourcePath, filePath);

  // Determine the output path based on the language
  const basePath = path.join(projectRoot, "src/content/docs");
  const newPath =
    options.language === "zh"
      ? path.join(basePath, "zh", relativePath)
      : options.language === "ja"
        ? path.join(basePath, "ja", relativePath)
        : path.join(basePath, relativePath);

  // Ensure the directory exists
  await fs.mkdir(path.dirname(newPath), { recursive: true });

  // Write the transformed content
  await fs.writeFile(newPath, newContent, "utf-8");

  logger.log("Migration", "Processed:", relativePath);
  progress.updateFile(relativePath);
}

interface SourcePaths {
  en: string;
  zh: string;
  ja?: string;
}

async function getSourcePathsFromCommit(commit: string, language: string): Promise<string> {
  const tempDir = path.join(projectRoot, `temp-nextra-docs-${language}`);
  logger.log("Migration", `Cloning specific commit for ${language} content...`);

  try {
    // Remove temp directory if it exists
    await fs.rm(tempDir, { recursive: true, force: true });

    // Download the repository zip for specific commit
    const repoUrl = `https://api.github.com/repos/aptos-labs/developer-docs/zipball/${commit}`;
    const zipPath = path.join(tempDir, "repo.zip");

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Download with progress
    await downloadWithProgress(repoUrl, zipPath);

    // Extract the zip
    progress.updateDownloadProgress(0, 100, "Extracting repository...");
    await extract(zipPath, {
      dir: tempDir,
      onEntry: () => {
        progress.updateDownloadProgress(50, 100, "Extracting repository...");
      },
    });
    progress.resetDownload();

    // Clean up zip file
    await fs.unlink(zipPath);

    // Find the extracted directory
    const entries = await fs.readdir(tempDir);
    const extractedDir = entries.find((entry) => entry.startsWith("aptos-labs-developer-docs-"));
    if (!extractedDir) {
      throw new Error("Could not find extracted repository directory");
    }

    const contentPath = path.join(tempDir, extractedDir, "apps", "nextra", "pages", language);
    logger.log("Migration", `Using ${language} content from commit ${commit}:`, contentPath);
    return contentPath;
  } catch (error) {
    logger.log("Migration", `Failed to get ${language} content from commit ${commit}:`, error);
    throw error;
  }
}

async function getSourcePaths(): Promise<SourcePaths> {
  const localPath = path.join(projectRoot, "nextra-migration");

  try {
    await fs.access(localPath);
    // Check if directory has any .mdx files
    const entries = await fs.readdir(localPath, { withFileTypes: true, recursive: true });
    const hasMdxFiles = entries.some((entry) => entry.isFile() && /\.mdx?$/.test(entry.name));

    if (hasMdxFiles) {
      logger.log("Migration", "Using local nextra-migration directory");
      return {
        en: localPath,
        zh: localPath,
      };
    }
  } catch (error) {
    logger.log("Migration", "Local nextra-migration directory not found or empty");
  }

  // Fall back to GitHub repository
  const tempDir = path.join(projectRoot, "temp-nextra-docs");
  logger.log("Migration", "Cloning Aptos developer docs repository...");

  try {
    // Remove temp directory if it exists
    await fs.rm(tempDir, { recursive: true, force: true });

    // Download the repository zip
    const repoUrl = "https://api.github.com/repos/aptos-labs/developer-docs/zipball";
    const zipPath = path.join(tempDir, "repo.zip");

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Download with progress
    await downloadWithProgress(repoUrl, zipPath);

    // Extract the zip
    progress.updateDownloadProgress(0, 100, "Extracting repository...");
    await extract(zipPath, {
      dir: tempDir,
      onEntry: () => {
        // Update progress for each file extracted
        progress.updateDownloadProgress(50, 100, "Extracting repository...");
      },
    });
    progress.resetDownload();

    // Clean up zip file
    await fs.unlink(zipPath);

    // Find the extracted directory (it will have a prefix like aptos-labs-developer-docs-hash)
    const entries = await fs.readdir(tempDir);
    const extractedDir = entries.find((entry) => entry.startsWith("aptos-labs-developer-docs-"));
    if (!extractedDir) {
      throw new Error("Could not find extracted repository directory");
    }

    const basePath = path.join(tempDir, extractedDir, "apps", "nextra", "pages");
    const paths = {
      en: path.join(basePath, "en"),
      zh: path.join(basePath, "zh"),
    };

    logger.log("Migration", "Using GitHub repository sources:", paths);
    return paths;
  } catch (error) {
    logger.log("Migration", "Failed to clone repository:", error);
    throw error;
  }
}

async function countMdxFiles(
  dirPath: string,
  ignoredFolders: string[],
  config: MigrationConfig,
): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredFolders.includes(entry.name)) {
        count += await countMdxFiles(fullPath, ignoredFolders, config);
      }
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      const relativePath = path.relative(dirPath, fullPath);
      if (!config.shouldSkipFile(relativePath)) {
        count++;
      }
    }
  }

  return count;
}

async function processDirectory(
  dirPath: string,
  options: ExtendedTransformerOptions,
  config: MigrationConfig,
): Promise<void> {
  logger.log("Migration", "Processing directory:", dirPath);
  logger.log("Migration", "With options:", {
    language: options.language,
    sourcePath: options.sourcePath,
    useComponentSyntax: options.useComponentSyntax,
  });

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  logger.log("Migration", `Found ${entries.length} entries in ${dirPath}`);
  logger.log(
    "Migration",
    "Directory entries:",
    entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    })),
  );

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      logger.log("Migration", "Found directory:", entry.name);
      // Check if this directory should be ignored
      if (config.ignoredFolders.includes(entry.name)) {
        logger.log("Migration", "Skipping ignored directory:", entry.name);
        continue;
      }
      await processDirectory(fullPath, options, config);
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      const relativePath = path.relative(options.sourcePath || "", fullPath);
      if (config.shouldSkipFile(relativePath)) {
        logger.log("Migration", "Skipping file:", entry.name);
        continue;
      }
      logger.log("Migration", "Found MDX file:", entry.name);
      try {
        logger.log("Migration", "Processing file:", {
          fullPath,
          relativePath,
          language: options.language,
        });
        await processFile(fullPath, options);
        logger.log("Migration", "Successfully processed file:", entry.name);
      } catch (error) {
        logger.log("Migration", "Error processing file:", {
          file: fullPath,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        progress.addFailedFile(relativePath);
      }
    } else {
      logger.log("Migration", "Skipping non-MDX file:", entry.name);
    }
  }
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  logger.log("Migration", `Copying directory from ${source} to ${destination}`);

  // Create destination directory
  await fs.mkdir(destination, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      await fs.copyFile(sourcePath, destPath);
      logger.log("Migration", `Copied file: ${entry.name}`);
    }
  }
}

async function copyImages(sourcePath: string): Promise<void> {
  const imagesDestPath = path.join(projectRoot, "public", "images");
  const tempDir = path.join(projectRoot, "temp-nextra-docs");

  try {
    // Create the public/images directory if it doesn't exist
    await fs.mkdir(imagesDestPath, { recursive: true });

    // Find the extracted directory (same as used in getSourcePath)
    const entries = await fs.readdir(tempDir);
    const extractedDir = entries.find((entry) => entry.startsWith("aptos-labs-developer-docs-"));
    if (!extractedDir) {
      throw new Error("Could not find extracted repository directory");
    }

    const extractedPath = path.join(tempDir, extractedDir);
    const docsSourcePath = path.join(extractedPath, "apps", "nextra", "public", "docs");
    const screenshotsSourcePath = path.join(
      extractedPath,
      "apps",
      "nextra",
      "public",
      "screenshots",
    );

    logger.log("Migration", "Copying docs images from:", docsSourcePath);
    logger.log("Migration", "Copying screenshots from:", screenshotsSourcePath);

    // Copy docs folder contents
    try {
      await fs.access(docsSourcePath);
      await copyDirectory(docsSourcePath, imagesDestPath);
      logger.log("Migration", "Successfully copied docs images");
    } catch (error) {
      logger.log("Migration", "Error copying docs images:", error);
    }

    // Copy screenshots folder
    const screenshotsDestPath = path.join(imagesDestPath, "screenshots");
    try {
      await fs.access(screenshotsSourcePath);
      await copyDirectory(screenshotsSourcePath, screenshotsDestPath);
      logger.log("Migration", "Successfully copied screenshots");
    } catch (error) {
      logger.log("Migration", "Error copying screenshots:", error);
    }

    logger.log("Migration", "Finished image migration");
  } catch (error) {
    logger.log("Migration", "Error during image migration:", error);
    throw error;
  }
}

async function main() {
  program
    .option("--use-directive-syntax", "Use ::: syntax instead of component syntax")
    .option("--ignore <folders>", "Comma-separated list of folders to ignore")
    .parse(process.argv);

  const options = program.opts();

  // Setup migration configuration
  const config: MigrationConfig = {
    ignoredFolders: options.ignore ? options.ignore.split(",") : ["developer-platforms"],
    useComponentSyntax: !options.useDirectiveSyntax,
    shouldSkipFile: (relativePath: string) => {
      // Add any file skip conditions here
      return relativePath === "index.mdx" || relativePath.endsWith("_meta.tsx");
    },
  };

  try {
    const sourcePaths = await getSourcePaths();

    // Count total files from both English and Chinese content
    logger.log("Migration", "Counting files to process...");
    const enTotalFiles = await countMdxFiles(sourcePaths.en, config.ignoredFolders, config);
    let zhTotalFiles = 0;

    try {
      await fs.access(sourcePaths.zh);
      zhTotalFiles = await countMdxFiles(sourcePaths.zh, config.ignoredFolders, config);
      logger.log("Migration", "Found Chinese files to process:", zhTotalFiles);
    } catch (error) {
      logger.log("Migration", "No Chinese content directory found");
    }

    // Get Japanese content from specific commit
    logger.log("Migration", "Getting Japanese content from specific commit...");
    let jaTotalFiles = 0;
    let jaSourcePath: string | undefined;

    try {
      jaSourcePath = await getSourcePathsFromCommit(
        "a84b622ec110313a79f4901b6a8a5119635c325d",
        "ja",
      );
      jaTotalFiles = await countMdxFiles(jaSourcePath, config.ignoredFolders, config);
      logger.log("Migration", "Found Japanese files to process:", jaTotalFiles);
    } catch (error) {
      logger.log("Migration", "No Japanese content found in specified commit");
    }

    // Set total files count for all languages
    const totalFiles = enTotalFiles + zhTotalFiles + jaTotalFiles;
    progress.setTotalFiles(totalFiles);

    // Process English content first
    logger.log("Migration", "Starting English content migration from:", sourcePaths.en);
    await processDirectory(
      sourcePaths.en,
      {
        useComponentSyntax: config.useComponentSyntax,
        sourcePath: sourcePaths.en,
        language: "en",
      },
      config,
    );

    // Process Chinese content if it exists
    if (zhTotalFiles > 0) {
      logger.log("Migration", "Starting Chinese content migration from:", sourcePaths.zh);

      // Debug: List contents of Chinese directory
      const zhContents = await fs.readdir(sourcePaths.zh, { withFileTypes: true });
      logger.log(
        "Migration",
        "Chinese directory contents:",
        zhContents.map((entry) => entry.name),
      );

      await processDirectory(
        sourcePaths.zh,
        {
          useComponentSyntax: config.useComponentSyntax,
          sourcePath: sourcePaths.zh,
          language: "zh",
        },
        config,
      );

      // Debug: Verify Chinese content was copied
      const zhDestPath = path.join(projectRoot, "src/content/docs/zh");
      const zhDestContents = await fs.readdir(zhDestPath).catch(() => []);
      logger.log("Migration", "Chinese destination contents:", zhDestContents);
    }

    // Process Japanese content if it exists
    if (jaTotalFiles > 0 && jaSourcePath) {
      logger.log("Migration", "Starting Japanese content migration from:", jaSourcePath);

      // Debug: List contents of Japanese directory
      const jaContents = await fs.readdir(jaSourcePath, { withFileTypes: true });
      logger.log(
        "Migration",
        "Japanese directory contents:",
        jaContents.map((entry) => entry.name),
      );

      await processDirectory(
        jaSourcePath,
        {
          useComponentSyntax: config.useComponentSyntax,
          sourcePath: jaSourcePath,
          language: "ja",
        },
        config,
      );

      // Debug: Verify Japanese content was copied
      const jaDestPath = path.join(projectRoot, "src/content/docs/ja");
      const jaDestContents = await fs.readdir(jaDestPath).catch(() => []);
      logger.log("Migration", "Japanese destination contents:", jaDestContents);
    }

    // Copy images after processing MDX files
    logger.log("Migration", "Starting image migration");
    await copyImages(sourcePaths.en); // Using English path as base for images

    // Clean up temp directories
    const tempDirs = [
      path.join(projectRoot, "temp-nextra-docs"),
      path.join(projectRoot, "temp-nextra-docs-ja"),
    ];

    for (const dir of tempDirs) {
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {
        logger.log("Migration", `Note: Could not remove temp directory ${dir} (it may not exist)`);
      });
    }

    progress.complete();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.log("Migration", "Error during migration:", errorMessage);
    progress.error(errorMessage);
    process.exit(1);
  }
}

main();
