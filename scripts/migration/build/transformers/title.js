export class TitleTransformer {
  transform(ast, options) {
    // First pass: find frontmatter and first h1
    let frontmatterNode;
    let frontmatterIndex = -1;
    let headingIndex = -1;
    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterNode = node;
        frontmatterIndex = index;
      } else if (node.type === "heading" && node.depth === 1 && headingIndex === -1) {
        headingIndex = index;
      }
    });
    // If we found an h1 heading, get its title
    let title;
    if (headingIndex !== -1) {
      const heading = ast.children[headingIndex];
      title = heading.children.map((child) => ("value" in child ? child.value : "")).join("");
    }
    if (title) {
      if (frontmatterNode) {
        // Add title to existing frontmatter
        const frontmatterLines = frontmatterNode.value.split("\n");
        const hasTitleLine = frontmatterLines.some((line) => line.trim().startsWith("title:"));
        if (!hasTitleLine) {
          // Add title while preserving existing frontmatter
          frontmatterLines.splice(frontmatterLines.length - 1, 0, `title: "${title}"`);
          frontmatterNode.value = frontmatterLines.join("\n");
        }
      } else {
        // Create new frontmatter
        frontmatterNode = {
          type: "yaml",
          value: `title: "${title}"`,
        };
        // Create blank line node
        const blankLine = {
          type: "paragraph",
          children: [],
        };
        // Add frontmatter at the beginning
        ast.children.unshift(blankLine);
        ast.children.unshift(frontmatterNode);
        // Adjust headingIndex since we added nodes at the start
        headingIndex += 2;
      }
      // Remove the original heading
      ast.children.splice(headingIndex, 1);
    }
  }
}
