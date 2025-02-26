import { visit } from "unist-util-visit";
import type { Root, Link } from "mdast";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";
import path from "node:path";
import { logger } from "../utils/logger.js";

export class HrefTransformer extends BaseTransformer {
  protected componentNames: string[] = [];
  protected oldImportPath: string = "";
  protected newImportPath: string = "";

  private getLanguageFromPath(filePath: string): string | undefined {
    const match = filePath.match(/[/\\](zh|ja)[/\\]/);
    return match ? match[1] : undefined;
  }

  // Override the base transform method since we don't need component checking
  transform(ast: Root, options: TransformerOptions): void {
    logger.log("HrefTransformer", "Starting href transformation");
    this.transformComponents(ast, options);
    logger.log("HrefTransformer", "Finished href transformation");
  }

  protected transformComponents(
    ast: Root,
    options: TransformerOptions & { sourcePath?: string },
  ): void {
    if (!options.filePath || !options.sourcePath) {
      logger.log("HrefTransformer", "Missing filePath or sourcePath in HrefTransformer");
      return;
    }

    // Get the current file's directory relative to the source path
    const relativePath = path.relative(options.sourcePath, path.dirname(options.filePath));

    logger.log("HrefTransformer", "Processing file:", options.filePath);
    logger.log("HrefTransformer", "Source path:", options.sourcePath);
    logger.log("HrefTransformer", "Relative path:", relativePath);

    const transformHref = (href: string): string => {
      logger.log("HrefTransformer", "Transforming href:", href);
      logger.log("HrefTransformer", "Current relativePath:", relativePath);

      // Skip external links or anchor links
      if (href.startsWith("http") || href.startsWith("#")) {
        logger.log("HrefTransformer", "Skipping external/anchor link");
        return href;
      }

      let result = href;

      // Handle absolute paths
      if (href.startsWith("/")) {
        logger.log("HrefTransformer", "Found absolute path");
        result = href;
      }
      // Handle relative paths starting with ./
      else if (href.startsWith("./")) {
        // Use the full relative path instead of just the last directory
        const normalizedPath = relativePath.split(path.sep).join("/");
        // Remove ./ and transform to absolute path with full path
        result = `/${normalizedPath}/${href.slice(2)}`;
        logger.log("HrefTransformer", "Transformed ./ path to:", result);
      }
      // Handle parent directory paths ../
      else if (href.startsWith("../")) {
        // Split the path into segments
        const segments = href.split("/");
        // Count how many levels up we're going
        let upCount = 0;
        while (segments[0] === "..") {
          upCount++;
          segments.shift();
        }

        // Get the current path segments
        const currentSegments = relativePath.split(path.sep);
        logger.log("HrefTransformer", "Current path segments:", currentSegments);
        logger.log("HrefTransformer", "Going up", upCount, "levels");

        // Remove the appropriate number of segments based on ../
        const targetSegments = currentSegments.slice(0, -upCount);
        logger.log("HrefTransformer", "Target segments after going up:", targetSegments);

        // Add the remaining path segments
        result = `/${[...targetSegments, ...segments].join("/")}`;
        logger.log("HrefTransformer", "Transformed ../ path to:", result);
      }
      // Handle paths without special prefixes (treat as relative to current directory)
      else if (!href.startsWith("/")) {
        // Use the full relative path
        const normalizedPath = relativePath.split(path.sep).join("/");
        if (normalizedPath) {
          result = `/${normalizedPath}/${href}`;
          logger.log("HrefTransformer", "Transformed relative path to:", result);
        } else {
          // Handle files at the root
          result = `/${href}`;
          logger.log("HrefTransformer", "File at root, transformed to absolute path:", result);
        }
      }

      // Remove .mdx extension if present
      if (result.endsWith(".mdx")) {
        const oldResult = result;
        result = result.slice(0, -4);
        logger.log("HrefTransformer", `Removed .mdx extension: ${oldResult} -> ${result}`);
      }

      // Add language prefix for zh/ja content if path is absolute
      // (at this point all paths should be absolute)
      if (result.startsWith("/")) {
        const language = this.getLanguageFromPath(options.filePath || "");
        if (language) {
          result = `/${language}${result}`;
          logger.log("HrefTransformer", `Added language prefix: ${result}`);
        }
      }

      logger.log("HrefTransformer", "Final transformed href:", result);
      return result;
    };

    // Transform markdown links
    visit(ast, "link", (node: Link) => {
      logger.log("HrefTransformer", "Found link node with URL:", node.url);
      node.url = transformHref(node.url);
      logger.log("HrefTransformer", "Updated link URL to:", node.url);
    });

    // Transform href attributes in any MDX component
    const visitNode = (node: any) => {
      logger.log("HrefTransformer", "Visiting node type:", node.type);

      if (node.type.startsWith("mdxJsx")) {
        if (node.attributes) {
          const hrefAttr = node.attributes.find((attr: any) => attr.name === "href");
          if (hrefAttr) {
            if (typeof hrefAttr.value === "string") {
              logger.log("HrefTransformer", "Found href attribute with value:", hrefAttr.value);
              hrefAttr.value = transformHref(hrefAttr.value);
              logger.log("HrefTransformer", "Updated href attribute to:", hrefAttr.value);
            } else {
              logger.log(
                "HrefTransformer",
                "Found href attribute with non-string value type:",
                typeof hrefAttr.value,
              );
            }
          }
        }
      }
    };

    // Visit all MDX component nodes
    logger.log("HrefTransformer", "Starting MDX node traversal");
    visit(ast, ["mdxJsxFlowElement", "mdxJsxTextElement"], visitNode);
    logger.log("HrefTransformer", "Finished href transformation");
  }
}
