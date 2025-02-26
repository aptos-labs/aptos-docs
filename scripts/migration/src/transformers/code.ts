import type { Root } from "mdast";
import type { TransformerOptions } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class CodeTransformer {
  private normalizeLanguage(lang: string | null): string | null {
    if (!lang) return null;

    // Remove any trailing quotes
    lang = lang.replace(/"$/, "");

    // Convert to lowercase and normalize specific languages
    switch (lang.toLowerCase()) {
      case "powershell":
      case "move":
        return lang.toLowerCase();
      case "bash":
      case "sh":
        return "shellscript";
      case "ts":
        return "typescript";
      case "ip":
        logger.log("CodeTransformer", "Removing unsupported 'IP' language tag");
        return null;
      default:
        return lang;
    }
  }

  transform(tree: Root, _options: TransformerOptions): void {
    const visit = (node: any): void => {
      // Handle fenced code blocks
      if (node.type === "code") {
        const oldLang = node.lang;
        node.lang = this.normalizeLanguage(node.lang);
        if (oldLang !== node.lang) {
          logger.log(
            "CodeTransformer",
            `Normalized language tag: "${oldLang}" -> "${node.lang || "null"}"`,
          );
        }
      }
      // Handle mdxJsxTextElement nodes (inline code)
      else if (node.type === "mdxJsxTextElement" && node.name === "code") {
        // Convert to inlineCode node
        node.type = "inlineCode";
        // Get the original content
        const content = node.children?.[0]?.value || "";
        // Disabled - Convert any pipe characters to HTML entities (won't render / displays as raw text)
        // node.value = content.replace(/\|/g, "'\|'");
        node.value = content;
      }
      // Recursively visit all children
      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  }
}
