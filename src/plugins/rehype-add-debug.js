import { visit } from "unist-util-visit";

/**
 * A Rehype plugin to test if transformations are working.
 * Adds `data-debug="true"` to every `<p>` tag.
 */
export default function rehypeAddDebug() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "p") {
        node.properties["data-debug"] = "true";
      }
    });
  };
}
