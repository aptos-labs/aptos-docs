import { visit } from "unist-util-visit";
import type { Root, Heading, Node } from "mdast";
import type { TransformerOptions, YamlNode, ParagraphNode, Transformer } from "../types/index.js";
import path from "node:path";

export class TitleTransformer implements Transformer {
  private isNonEnglish(text: string): boolean {
    // Chinese: \u4e00-\u9fff
    // Japanese Hiragana: \u3040-\u309f
    // Japanese Katakana: \u30a0-\u30ff
    // Japanese Kanji: \u4e00-\u9faf
    return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text);
  }

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
    let capitalTitle: string | undefined;
    let headingIndex = -1;

    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterNode = node as YamlNode;
        // Extract title from frontmatter, case insensitive
        const titleMatch = /^title:\s*["']?([^"'\n]+)["']?/im.exec(node.value);
        if (titleMatch) {
          frontmatterTitle = titleMatch[1].trim();
        }
        // Extract Title (capital T) from frontmatter
        const capitalTitleMatch = /^Title:\s*["']?([^"'\n]+)["']?/m.exec(node.value);
        if (capitalTitleMatch) {
          capitalTitle = capitalTitleMatch[1].trim();
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

    // Determine the final title to use
    let finalTitle: string;

    // If we have an h1 with Chinese/Japanese characters and either:
    // - there's no frontmatter title, or
    // - the frontmatter title is English-only
    if (
      h1Title &&
      this.isNonEnglish(h1Title) &&
      (!frontmatterTitle || !this.isNonEnglish(frontmatterTitle))
    ) {
      finalTitle = h1Title;
    } else {
      finalTitle =
        capitalTitle ||
        frontmatterTitle ||
        h1Title ||
        this.getTitleFromFilename(options.filePath || "");
    }

    // Create or update frontmatter
    if (!frontmatterNode) {
      // No frontmatter exists, create it
      frontmatterNode = {
        type: "yaml",
        value: `title: "${finalTitle}"`,
      };

      // Create blank line node
      const blankLine: ParagraphNode = {
        type: "paragraph",
        children: [],
      };

      // Add frontmatter at the beginning
      ast.children.unshift(blankLine);
      ast.children.unshift(frontmatterNode);

      // Adjust heading index if it exists
      if (headingIndex !== -1) {
        headingIndex += 2;
      }
    } else {
      // Update existing frontmatter
      let frontmatterLines = frontmatterNode.value.split("\n");

      // Remove old title and Title lines
      frontmatterLines = frontmatterLines.filter(
        (line) => !line.match(/^title:/i) && !line.match(/^Title:/),
      );

      // Add new title line
      frontmatterLines.push(`title: "${finalTitle}"`);

      // Update frontmatter
      frontmatterNode.value = frontmatterLines.join("\n");
    }

    // Remove the h1 heading since we're using the title from frontmatter
    if (headingIndex !== -1) {
      ast.children.splice(headingIndex, 1);
    }
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }
}
