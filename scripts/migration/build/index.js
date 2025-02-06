import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxFromMarkdown, mdxToMarkdown } from "mdast-util-mdx";
import { mdxjs } from "micromark-extension-mdxjs";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { CalloutTransformer } from "./transformers/callout.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");
async function processFile(filePath, options) {
  const content = await fs.readFile(filePath, "utf-8");
  // Parse MDX content into AST
  const ast = fromMarkdown(content, {
    extensions: [mdxjs(), directive()],
    mdastExtensions: [mdxFromMarkdown(), directiveFromMarkdown()],
  });
  // Apply transformations
  const transformers = [new CalloutTransformer()];
  for (const transformer of transformers) {
    transformer.transform(ast, options);
  }
  // Convert AST back to MDX
  const newContent = toMarkdown(ast, {
    extensions: [mdxToMarkdown(), directiveToMarkdown()],
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
async function processDirectory(dirPath, options) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath, options);
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      await processFile(fullPath, options);
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
