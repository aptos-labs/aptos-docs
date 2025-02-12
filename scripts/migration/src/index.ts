import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxFromMarkdown, mdxToMarkdown } from "mdast-util-mdx";
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
import { exec } from "node:child_process";

import { CalloutTransformer } from "./transformers/callout.js";
import { TitleTransformer } from "./transformers/title.js";
import { ImportTransformer } from "./transformers/import.js";
import { FrontmatterTransformer } from "./transformers/frontmatter.js";
import { CardsTransformer } from "./transformers/cards.js";
import { LinkCardTransformer } from "./transformers/linkCard.js";
import { TabsTransformer } from "./transformers/tabs.js";
import { StepsTransformer } from "./transformers/steps.js";
import { FileTreeTransformer } from "./transformers/fileTree.js";
import { CustomComponentTransformer } from "./transformers/custom-components.js";
import { CodeTransformer } from "./transformers/code.js";
import type { TransformerOptions } from "./types/index.js";

interface ExtendedTransformerOptions extends TransformerOptions {
  sourcePath?: string;
}
import type { Handle, State } from "mdast-util-to-markdown";

interface MigrationConfig {
  ignoredFolders: string[];
  useComponentSyntax: boolean;
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
  console.log("\nAST for file:", filePath);
  console.log(
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

  // Add filePath to options for transformers
  const transformerOptions = {
    ...options,
    filePath,
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
    new ImportTransformer(componentMappings),
  ];

  for (const transformer of transformers) {
    transformer.transform(ast, transformerOptions);
  }

  // Convert AST back to MDX
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

      // Custom handler to prevent root child indentation of FileTree and Steps components.
      // Unfortunately this messes with all other components and will not render them correctly despite the conditional statement.

      // mdxJsxFlowElement: ((node, parent, context: State) => {
      //   if (node.name === "FileTree" || node.name === "Steps") {
      //     const exit = context.enter("mdxJsxFlowElement");
      //     const nodeContent = node.children
      //       .map((child: any) =>
      //         context.handle(child, node, context, {
      //           after: "",
      //           before: "",
      //           lineShift: 0,
      //           now: { line: 1, column: 1 },
      //         }),
      //       )
      //       .join("\n");
      //     exit();
      //     return `<${node.name}>\n\n${nodeContent}\n\n</${node.name}>`;
      //   }
      //   return null;
      // }) as Handle,
    },
  });

  // Calculate the new file path
  if (!options.sourcePath) {
    throw new Error("Source path not provided in options");
  }
  const relativePath = path.relative(options.sourcePath, filePath);
  const newPath = path.join(projectRoot, "src/content/docs", relativePath);

  // Ensure the directory exists
  await fs.mkdir(path.dirname(newPath), { recursive: true });

  // Write the transformed content
  await fs.writeFile(newPath, newContent, "utf-8");

  console.log(`Processed: ${relativePath}`);
}

async function getSourcePath(): Promise<string> {
  const localPath = path.join(projectRoot, "nextra-migration");

  try {
    await fs.access(localPath);
    // Check if directory has any .mdx files
    const entries = await fs.readdir(localPath, { withFileTypes: true, recursive: true });
    const hasMdxFiles = entries.some((entry) => entry.isFile() && /\.mdx?$/.test(entry.name));

    if (hasMdxFiles) {
      console.log("Using local nextra-migration directory");
      return localPath;
    }
  } catch (error) {
    console.log("Local nextra-migration directory not found or empty");
  }

  // Fall back to GitHub repository
  const tempDir = path.join(projectRoot, "temp-nextra-docs");
  console.log("Cloning Aptos developer docs repository...");

  try {
    // Remove temp directory if it exists
    await fs.rm(tempDir, { recursive: true, force: true });

    // Clone the repository
    await new Promise<void>((resolve, reject) => {
      exec(
        `git clone --depth 1 "https://github.com/aptos-labs/developer-docs.git" "${tempDir}"`,
        (error: Error | null) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    const sourcePath = path.join(tempDir, "apps", "nextra", "pages", "en");
    console.log(`Using GitHub repository source: ${sourcePath}`);
    return sourcePath;
  } catch (error) {
    console.error("Failed to clone repository:", error);
    throw error;
  }
}

async function processDirectory(
  dirPath: string,
  options: ExtendedTransformerOptions,
  config: MigrationConfig,
): Promise<void> {
  console.log(`Processing directory: ${dirPath}`);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  console.log(`Found ${entries.length} entries in ${dirPath}`);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      console.log(`Found directory: ${entry.name}`);
      // Check if this directory should be ignored
      if (config.ignoredFolders.includes(entry.name)) {
        console.log(`Skipping ignored directory: ${entry.name}`);
        continue;
      }
      await processDirectory(fullPath, options, config);
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      console.log(`Found MDX file: ${entry.name}`);
      try {
        await processFile(fullPath, options);
      } catch (error) {
        console.error(`Error processing file ${fullPath}:`, error);
      }
    } else {
      console.log(`Skipping non-MDX file: ${entry.name}`);
    }
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
  };

  try {
    const sourcePath = await getSourcePath();
    console.log(`Starting migration from ${sourcePath}`);
    console.log("Ignored folders:", config.ignoredFolders);

    await processDirectory(
      sourcePath,
      {
        useComponentSyntax: config.useComponentSyntax,
        sourcePath,
      },
      config,
    );

    // Clean up temp directory if it exists
    const tempDir = path.join(projectRoot, "temp-nextra-docs");
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

main();
