import { visit } from "unist-util-visit";

/**
 * A Rehype plugin that removes the anchor links section at the top of Move reference files.
 * This section typically starts with a list of links and ends before the first heading.
 */
export default function rehypeRemoveAnchorLinks() {
  return (tree) => {
    // Find the initial anchor and the list of links
    let initialAnchorIndex = -1;
    let linkListIndex = -1;

    visit(tree, "element", (node, index) => {
      // Find the initial anchor tag (e.g., <a id="0x4_aptos_token"></a>)
      if (node.tagName === "a" && node.properties?.id && node.children?.length === 0) {
        initialAnchorIndex = index;
      }

      // Look for the list that contains anchor links
      if (node.tagName === "ul") {
        // Check if this list contains anchor links
        const hasAnchorLinks = node.children?.some(
          (child) =>
            child.tagName === "li" &&
            child.children?.[0]?.tagName === "a" &&
            child.children[0].properties?.href?.startsWith("#"),
        );

        if (hasAnchorLinks) {
          linkListIndex = index;
          return false; // Stop visiting
        }
      }
    });

    // Remove only the initial anchor and the list of links
    if (tree.children) {
      if (linkListIndex > -1) {
        // Remove the link list
        tree.children.splice(linkListIndex, 1);
      }
      if (initialAnchorIndex > -1) {
        // Remove the initial anchor
        tree.children.splice(initialAnchorIndex, 1);
      }
    }
  };
}
