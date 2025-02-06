export class TitleTransformer {
  transform(ast, options) {
    // First pass: find frontmatter and first h1
    let frontmatterNode;
    let frontmatterTitle;
    let headingIndex = -1;
    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterNode = node;
        // Extract title from frontmatter
        const match = /title:\s*["']?([^"'\n]+)["']?/i.exec(node.value);
        if (match) {
          frontmatterTitle = match[1].trim();
        }
      } else if (node.type === "heading" && node.depth === 1 && headingIndex === -1) {
        headingIndex = index;
      }
    });
    // If no frontmatter exists, create it from h1
    if (!frontmatterNode && headingIndex !== -1) {
      const heading = ast.children[headingIndex];
      const title = heading.children.map((child) => ("value" in child ? child.value : "")).join("");
      if (title) {
        // Create frontmatter node
        frontmatterNode = {
          type: "yaml",
          value: `title: "${title}"`,
        };
        // Create blank line node
        const blankLine = {
          type: "paragraph",
          children: [],
        };
        // Remove the original heading
        ast.children.splice(headingIndex, 1);
        // Add frontmatter at the beginning
        ast.children.unshift(blankLine);
        ast.children.unshift(frontmatterNode);
      }
    }
    // If frontmatter exists, handle the h1 heading
    else if (frontmatterTitle && headingIndex !== -1) {
      const heading = ast.children[headingIndex];
      const headingTitle = heading.children
        .map((child) => ("value" in child ? child.value : ""))
        .join("");
      if (headingTitle.trim() === frontmatterTitle.trim()) {
        // Remove duplicate heading
        ast.children.splice(headingIndex, 1);
      } else {
        // Convert h1 to h2
        heading.depth = 2;
      }
    }
  }
}
