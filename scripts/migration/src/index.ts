import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxFromMarkdown, mdxToMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { frontmatter } from "micromark-extension-frontmatter";
import { frontmatterFromMarkdown, frontmatterToMarkdown } from "mdast-util-frontmatter";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";

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
import type { Handle, State } from "mdast-util-to-markdown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");

async function processFile(filePath: string, options: TransformerOptions): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8");

  // Parse MDX content into AST
  const ast = fromMarkdown(content, {
    extensions: [mdxjs(), directive(), frontmatter(["yaml"]), gfm()],
    mdastExtensions: [
      mdxFromMarkdown(),
      directiveFromMarkdown(),
      frontmatterFromMarkdown(["yaml"]),
      gfmFromMarkdown(),
    ],
  });

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
      gfmToMarkdown(),
    ],
    bullet: "-",
    listItemIndent: "one",
    bulletOther: "*",
    tightDefinitions: false,
    fences: true,
    handlers: {
      text: ((node) => {
        // Don't escape underscores in text nodes
        return node.value.replace(/\\_/g, "_");
      }) as Handle,
      mdxJsxFlowElement: ((node, parent, context: State) => {
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
      }) as Handle,
    },
  });

  // Calculate the new file path
  const relativePath = path.relative(path.join(projectRoot, "nextra-migration"), filePath);

  const newPath = path.join(projectRoot, "src/content/docs", relativePath);

  // Ensure the directory exists
  await fs.mkdir(path.dirname(newPath), { recursive: true });

  // Write the transformed content
  await fs.writeFile(newPath, newContent, "utf-8");

  console.log(`Processed: ${relativePath}`);
}

async function processDirectory(dirPath: string, options: TransformerOptions): Promise<void> {
  console.log(`Processing directory: ${dirPath}`);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  console.log(`Found ${entries.length} entries in ${dirPath}`);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      console.log(`Found directory: ${entry.name}`);
      await processDirectory(fullPath, options);
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
    .parse(process.argv);

  const options = program.opts();

  try {
    const sourcePath = path.join(projectRoot, "nextra-migration");
    console.log(`Starting migration from ${sourcePath}`);

    // Check if source directory exists
    try {
      await fs.access(sourcePath);
      console.log("Source directory exists");
    } catch (error) {
      console.error("Source directory does not exist:", sourcePath);
      process.exit(1);
    }

    await processDirectory(sourcePath, {
      useComponentSyntax: !options.useDirectiveSyntax, // Default to component syntax
    });
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

main();
