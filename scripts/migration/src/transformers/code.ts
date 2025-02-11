import type { Root } from "mdast";
import type { TransformerOptions } from "../types/index.js";

export class CodeTransformer {
  transform(tree: Root, _options: TransformerOptions): void {
    const visit = (node: any): void => {
      // Handle mdxJsxTextElement nodes
      if (node.type === "mdxJsxTextElement" && node.name === "code") {
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
