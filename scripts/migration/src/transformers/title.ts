import type { Root, Heading, Node } from "mdast";
import type {
  Transformer,
  TransformerOptions,
  RootContentWithMdx,
  YamlNode,
  ParagraphNode,
} from "../types/index.js";

export class TitleTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // First pass: find frontmatter and first h1
    let frontmatterNode: YamlNode | undefined;
    let frontmatterTitle: string | undefined;
    let headingIndex = -1;

    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterNode = node as YamlNode;
        // Extract title from frontmatter
        const match = /title:\s*["']?([^"'\n]+)["']?/i.exec(node.value);
        if (match) {
          frontmatterTitle = match[1].trim();
        }
      } else if (node.type === "heading" && (node as Heading).depth === 1 && headingIndex === -1) {
        headingIndex = index;
      }
    });

    // If no frontmatter exists, create it from h1
    if (!frontmatterNode && headingIndex !== -1) {
      const heading = ast.children[headingIndex] as Heading;
      const title = heading.children
        .map((child: Node) => ("value" in child ? child.value : ""))
        .join("");

      if (title) {
        // Create frontmatter node
        frontmatterNode = {
          type: "yaml",
          value: `title: "${title}"`,
        };

        // Create blank line node
        const blankLine: ParagraphNode = {
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
      const heading = ast.children[headingIndex] as Heading;
      const headingTitle = heading.children
        .map((child: Node) => ("value" in child ? child.value : ""))
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
