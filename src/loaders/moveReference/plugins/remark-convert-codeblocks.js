import { visit } from "unist-util-visit";

/**
 * A Remark plugin that:
 * - Converts <pre><code>...</code></pre> HTML blocks into proper fenced code blocks.
 * - Removes extra HTML markup inside <code> blocks (e.g., <b>, <a>, etc.).
 * - Wraps content with ```move fenced code blocks.
 */
export default function remarkConvertCodeBlocks() {
  return (tree) => {
    visit(tree, "html", (node, index, parent) => {
      const match = node.value.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
      if (match) {
        let codeContent = match[1]
          // Remove <b>, <strong>, <i> while keeping their content
          .replace(/<\/?(b|strong|i)>/g, "")
          // Remove <a> tags but keep the text inside
          .replace(/<a [^>]*>(.*?)<\/a>/g, "$1")
          // Remove any other residual HTML tags
          .replace(/<\/?[^>]+(>|$)/g, "")
          // Decode HTML entities
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();

        // Replace the HTML node with a fenced code block node
        parent.children[index] = {
          type: "code",
          lang: "move",
          value: codeContent,
        };
      }
    });
  };
}
