import { visit } from "unist-util-visit";
import type { Root, Image } from "mdast";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";
import { logger } from "../utils/logger.js";

export class ImageTransformer extends BaseTransformer {
  protected componentNames: string[] = [];
  protected oldImportPath: string = "";
  protected newImportPath: string = "";

  // Override the base transform method since we don't need component checking
  transform(ast: Root, options: TransformerOptions): void {
    logger.log("ImageTransformer", "Starting image URL transformation");
    visit(ast, "image", (node: Image) => {
      logger.log("ImageTransformer", "Found image node with URL:", node.url);

      // Transform image URL
      node.url = this.transformImageUrl(node.url);

      logger.log("ImageTransformer", "Updated image URL to:", node.url);
    });
    logger.log("ImageTransformer", "Finished image URL transformation");
  }

  // Implement required method from BaseTransformer but we don't use it
  protected transformComponents(ast: Root, options: TransformerOptions): void {
    // No-op since we override transform
  }

  protected transformImageUrl(url: string): string {
    logger.log("ImageTransformer", "Transforming image URL:", url);

    // Skip external URLs
    if (url.startsWith("http") || url.startsWith("https")) {
      logger.log("ImageTransformer", "Skipping external URL");
      return url;
    }

    // Transform /docs/ to ~/images/ (using the alias defined in astro.config.mjs)
    if (url.startsWith("/docs/")) {
      const newUrl = url.replace("/docs/", "~/images/");
      logger.log("ImageTransformer", "Transformed URL from /docs/ to ~/images/:", newUrl);
      return newUrl;
    }

    // Handle relative paths that might point to docs
    if (url.startsWith("./docs/") || url.startsWith("../docs/")) {
      const newUrl = url.replace(/(?:\.\.\/)*docs\//, "~/images/");
      logger.log("ImageTransformer", "Transformed relative docs path to ~/images/:", newUrl);
      return newUrl;
    }

    // Handle paths that start with /screenshots/ or other direct paths
    if (url.startsWith("/screenshots/") || url.startsWith("/images/")) {
      const newUrl = "~/images" + url;
      logger.log("ImageTransformer", "Transformed direct path to ~/images path:", newUrl);
      return newUrl;
    }

    logger.log("ImageTransformer", "URL does not need transformation");
    return url;
  }
}
