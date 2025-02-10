import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class LinkCardTransformer extends BaseTransformer {
  protected componentNames = ["LinkCard"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  getComponentMap(): Map<string, string> {
    return new Map([["Card", "LinkCard"]]);
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && node.name === "Card") {
        const mdxNode = node as MdxJsxFlowElement;
        let title = "";
        let description = "";
        let href = "";
        let isExternal = false;

        // Extract href from attributes
        const hrefAttr = mdxNode.attributes.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === "href",
        );
        if (hrefAttr && "value" in hrefAttr && typeof hrefAttr.value === "string") {
          href = hrefAttr.value;
        }

        // Check for linkType="external"
        const linkTypeAttr = mdxNode.attributes.find(
          (attr) =>
            attr.type === "mdxJsxAttribute" &&
            attr.name === "linkType" &&
            attr.value === "external",
        );
        if (linkTypeAttr) {
          isExternal = true;
        }

        // Process all nodes to find Card.Title and Card.Description
        const { title: extractedTitle, description: extractedDescription } =
          this.findCardElements(mdxNode);
        title = extractedTitle;
        description = extractedDescription;

        // Transform to LinkCard if needed
        if (node.name === "Card") {
          mdxNode.name = "LinkCard";
        }
        mdxNode.children = [];
        mdxNode.attributes = [
          { type: "mdxJsxAttribute" as const, name: "href", value: href },
          ...(title ? [{ type: "mdxJsxAttribute" as const, name: "title", value: title }] : []),
          ...(description
            ? [{ type: "mdxJsxAttribute" as const, name: "description", value: description }]
            : []),
          ...(isExternal || href.startsWith("http")
            ? [{ type: "mdxJsxAttribute" as const, name: "target", value: "_blank" }]
            : []),
        ];
      }
    });
  }

  private findCardElements(node: any): { title: string; description: string } {
    let title = "";
    let description = "";

    // Helper to extract text from a node or its children
    const getNodeText = (n: any): string => {
      if (!n) return "";
      // Direct text node
      if (n.type === "text") return n.value || "";
      // Node with children
      if (n.children?.length > 0) {
        return n.children.map(getNodeText).join("");
      }
      return "";
    };

    // Helper to find elements in a paragraph
    const processChildren = (children: any[]): void => {
      children.forEach((child) => {
        // Handle mdxJsxTextElement (inline elements)
        if (child.type === "mdxJsxTextElement") {
          if (child.name === "Card.Title") {
            title = getNodeText(child);
          } else if (child.name === "Card.Description") {
            description = getNodeText(child);
          }
        }
        // Handle nested paragraphs
        if (child.type === "paragraph" && child.children) {
          processChildren(child.children);
        }
      });
    };

    // Process direct children first (for flow elements)
    node.children?.forEach((child: any) => {
      if (child.type === "mdxJsxFlowElement") {
        if (child.name === "Card.Title") {
          title = getNodeText(child);
        } else if (child.name === "Card.Description") {
          description = getNodeText(child);
        }
      }
      // Handle paragraph wrapping
      if (child.type === "paragraph" && child.children) {
        processChildren(child.children);
      }
    });

    return { title, description };
  }
}
