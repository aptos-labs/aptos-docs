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
        // Convert any pipe characters to HTML entities
        node.value = content.replace(/\|/g, "&#124;");
      }
      // Recursively visit all children
      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  }
}
