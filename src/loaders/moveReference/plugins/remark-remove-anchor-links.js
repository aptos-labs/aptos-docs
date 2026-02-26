import { toString as mdastToString } from "mdast-util-to-string";
import { remove } from "unist-util-remove";
import { visit } from "unist-util-visit";

/**
 * A Remark plugin that:
 * - Removes TOC lists (lists where all items are internal links)
 * - Removes empty anchor tags and their containing paragraphs
 * - Removes module headers
 */
export default function remarkRemoveTOCAndAnchors() {
  return (tree) => {
    // console.log("=== START DEBUGGING REMARK PLUGIN ===");

    // First pass: Remove all heading nodes that contain "Module" text
    remove(tree, (node) => {
      if (node.type === "heading" && node.depth === 1) {
        const text = mdastToString(node);
        // console.log("🔍 Checking heading:", text);
        if (text.includes("Module")) {
          // console.log("🔴 Removing module heading");
          return true;
        }
      }
      return false;
    });

    // Second pass: Remove paragraphs that only contain HTML anchor tags
    remove(tree, (node) => {
      if (node.type === "paragraph") {
        const children = node.children || [];
        // console.log("🔍 Checking paragraph children:", children);

        // Check if paragraph only contains HTML nodes
        if (children.every((child) => child.type === "html")) {
          const htmlContent = children.map((child) => child.value).join("");
          // console.log("📝 HTML content:", htmlContent);

          // Check if it's just an anchor tag
          if (htmlContent.includes('<a id="') && htmlContent.includes('"></a>')) {
            // console.log("🔴 Removing anchor paragraph");
            return true;
          }
        }
      }
      return false;
    });

    // Third pass: Remove standalone HTML anchor nodes
    remove(tree, (node) => {
      if (node.type === "html") {
        const value = node.value.trim();
        // console.log("🔍 Checking HTML node:", value);
        if (value.includes('<a id="') && value.includes('"></a>')) {
          // console.log("🔴 Removing standalone anchor");
          return true;
        }
      }
      return false;
    });

    // Fourth pass: Remove any remaining problematic nodes
    remove(tree, (node) => {
      if (node.type === "html") {
        const value = node.value.trim();
        // console.log("🔍 Final pass checking node:", value);

        // Match any remaining anchors or headers with more flexible patterns
        if (
          (value.includes("<a") && value.includes("id=")) ||
          (value.includes("<h1") && value.includes("Module"))
        ) {
          // console.log("🔴 Found remaining problematic node:", value);
          return true;
        }
      }
      return false;
    });

    // Fifth pass: Find and remove TOC lists
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
