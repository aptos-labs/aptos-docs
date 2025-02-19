import { visit } from "unist-util-visit";
import { remove } from "unist-util-remove";

/**
 * A Remark plugin that:
 * - Removes TOC lists (lists where all items are internal links)
 * - Removes empty <a id="..."></a> tags
 */
export default function remarkRemoveTOCAndAnchors() {
  return (tree) => {
    // console.log("=== START DEBUGGING REMARK PLUGIN ===");

    // First pass: Remove empty anchor tags
    remove(tree, (node) => {
      if (node.type === "html" && /^<a id="[^"]+"><\/a>$/.test(node.value.trim())) {
        // console.log(`🔴 Removing anchor tag: ${node.value.trim()}`);
        return true;
      }
      return false;
    });

    // Second pass: Find and remove TOC lists
    visit(tree, "list", (node, index, parent) => {
      // console.log("📌 Checking list at index:", index);
      // console.log("List children count:", node.children.length);

      // Skip lists that are too short to be a TOC
      if (node.children.length < 2) {
        // console.log("⚠️ Skipping: List too short");
        return;
      }

      // Check if this is a TOC by verifying the first several items are links
      // We don't check all items because the last few might be nested lists
      const sampleSize = Math.min(5, node.children.length);
      let validLinkCount = 0;

      for (const item of node.children) {
        // Skip if not a list item
        if (item.type !== "listItem") {
          // console.log("⚠️ Not a list item");
          return;
        }

        // Check if item has a paragraph with a link
        if (
          item.children[0]?.type === "paragraph" &&
          item.children[0].children[0]?.type === "link"
        ) {
          const link = item.children[0].children[0];
          // console.log(`🔍 Checking link: ${link.url}`);

          if (link.url.startsWith("#")) {
            validLinkCount++;
          }
        }
      }

      // Remove the list if we found enough valid links
      if (validLinkCount >= sampleSize && parent) {
        // console.log("🟢 Found TOC list at index:", index);
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
      }

      // console.log("⚠️ This list does NOT match TOC criteria");
    });

    // console.log("=== END DEBUGGING REMARK PLUGIN ===");
  };
}
