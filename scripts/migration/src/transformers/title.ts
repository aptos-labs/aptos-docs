import { visit } from "unist-util-visit";
import type { Root, Heading, Node } from "mdast";
import type { TransformerOptions, YamlNode, ParagraphNode, Transformer } from "../types/index.js";
import path from "node:path";

export class TitleTransformer implements Transformer {
  private getTitleFromFilename(filePath: string): string {
    if (!filePath) return "Untitled";

    // Get the base filename without extension
    const basename = path.basename(filePath, path.extname(filePath));

    // Convert kebab-case to Title Case
    return basename
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  transform(ast: Root, options: TransformerOptions): void {
    // First pass: find frontmatter and first h1
    let frontmatterNode: YamlNode | undefined;
    let frontmatterTitle: string | undefined;
    let headingIndex = -1;

    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterNode = node as YamlNode;
        // Extract title from frontmatter, case insensitive
        const match = /^(title|Title):\s*["']?([^"'\n]+)["']?/im.exec(node.value);
        if (match) {
          frontmatterTitle = match[2].trim();
          // Normalize frontmatter to use lowercase "title"
          frontmatterNode.value = frontmatterNode.value.replace(/^(title|Title):/im, "title:");
        }
      } else if (node.type === "heading" && (node as Heading).depth === 1 && headingIndex === -1) {
        headingIndex = index;
      }
    });

    // Extract title from h1 if we found one
    let h1Title: string | undefined;
    if (headingIndex !== -1) {
      const heading = ast.children[headingIndex] as Heading;
      h1Title = heading.children
        .map((child: Node) => ("value" in child ? child.value : ""))
        .join("")
        .trim();
    }

    // Handle different cases
    if (h1Title) {
      if (!frontmatterNode) {
        // No frontmatter exists, create it with title from h1
        frontmatterNode = {
          type: "yaml",
          value: `title: "${h1Title}"`,
        };

        // Create blank line node
        const blankLine: ParagraphNode = {
          type: "paragraph",
          children: [],
        };

        // Add frontmatter at the beginning
        ast.children.unshift(blankLine);
        ast.children.unshift(frontmatterNode);

        // Remove the original heading
        ast.children.splice(headingIndex + 2, 1); // +2 because we added two nodes at the start
      } else if (!frontmatterTitle) {
        // Frontmatter exists but no title, add title from h1
        frontmatterNode.value = frontmatterNode.value.trim();
        if (frontmatterNode.value) {
          frontmatterNode.value += "\n";
        }
        frontmatterNode.value += `title: "${h1Title}"`;

        // Remove the original heading
        ast.children.splice(headingIndex, 1);
      } else if (h1Title === frontmatterTitle) {
        // Both exist and match, remove duplicate h1
        ast.children.splice(headingIndex, 1);
      } else {
        // Both exist but don't match, convert h1 to h2
        (ast.children[headingIndex] as Heading).depth = 2;
      }
    } else if (!frontmatterTitle && frontmatterNode) {
      // No h1 but frontmatter exists without title
      const title = this.getTitleFromFilename(options.filePath || "");
      frontmatterNode.value = frontmatterNode.value.trim();
      if (frontmatterNode.value) {
        frontmatterNode.value += "\n";
      }
      frontmatterNode.value += `title: "${title}"`;
    } else if (!frontmatterNode) {
      // No frontmatter and no h1 - create minimal frontmatter with filename-based title
      const title = this.getTitleFromFilename(options.filePath || "");
      frontmatterNode = {
        type: "yaml",
        value: `title: "${title}"`,
      };

      // Create blank line node
      const blankLine: ParagraphNode = {
        type: "paragraph",
        children: [],
      };

      // Add frontmatter at the beginning
      ast.children.unshift(blankLine);
      ast.children.unshift(frontmatterNode);
    }
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }
}
