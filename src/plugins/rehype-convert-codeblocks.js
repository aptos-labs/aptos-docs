import { visit } from "unist-util-visit";

/**
 * A Rehype plugin that:
 * 1. Converts <pre><code>...</code></pre> into proper fenced code blocks.
 * 2. Removes extra HTML markup inside <code> blocks (e.g., <b>, <a>, etc.).
 */
export default function rehypeConvertCodeBlocks() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "pre" && node.children.length > 0) {
        const codeNode = node.children[0];

        if (codeNode.tagName === "code") {
          // Extract raw text from all elements inside <code>
          const codeContent = codeNode.children
            .map((child) => {
              if (child.type === "text") return child.value; // Keep plain text
              if (
                child.tagName === "b" ||
                child.tagName === "strong" ||
                child.tagName === "i" ||
                child.tagName === "a"
              ) {
                return child.children
                  .map((inner) => (inner.type === "text" ? inner.value : ""))
                  .join("");
              }
              return ""; // Strip everything else
            })
            .join("")
            .trim();

          // Ensure correct className for syntax highlighting
          node.properties.className = ["astro-code", "language-js"];
          codeNode.properties.className = ["language-move"];
          codeNode.children = [{ type: "text", value: codeContent }];
        }
      }
    });
  };
}
