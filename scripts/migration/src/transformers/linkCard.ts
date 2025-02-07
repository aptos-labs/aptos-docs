import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type {
  Transformer,
  TransformerOptions,
  MdxjsEsm,
  MdxJsxFlowElement,
} from "../types/index.js";

export class LinkCardTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    this.ensureLinkCardImport(ast);
    this.transformLinkCards(ast);
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

  private transformLinkCards(ast: Root): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && node.name === "Card") {
        const mdxNode = node as MdxJsxFlowElement;
        let title = "";
        let description = "";
        let href = "";

        // Extract href from attributes
        const hrefAttr = mdxNode.attributes.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === "href",
        );
        if (hrefAttr && "value" in hrefAttr && typeof hrefAttr.value === "string") {
          href = hrefAttr.value;
        }

        // Process all nodes to find Card.Title and Card.Description
        const { title: extractedTitle, description: extractedDescription } =
          this.findCardElements(mdxNode);
        title = extractedTitle;
        description = extractedDescription;

        // Transform to LinkCard
        mdxNode.name = "LinkCard";
        mdxNode.children = [];
        mdxNode.attributes = [
          { type: "mdxJsxAttribute" as const, name: "href", value: href },
          ...(title ? [{ type: "mdxJsxAttribute" as const, name: "title", value: title }] : []),
          ...(description
            ? [{ type: "mdxJsxAttribute" as const, name: "description", value: description }]
            : []),
        ];
      }
    });
  }

  private ensureLinkCardImport(ast: Root): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("LinkCard"),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "import { LinkCard } from '@astrojs/starlight/components';",
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ImportDeclaration",
                source: {
                  type: "Literal",
                  value: "@astrojs/starlight/components",
                  raw: "'@astrojs/starlight/components'",
                },
                specifiers: [
                  {
                    type: "ImportSpecifier",
                    imported: {
                      type: "Identifier",
                      name: "LinkCard",
                    },
                    local: {
                      type: "Identifier",
                      name: "LinkCard",
                    },
                  },
                ],
                importKind: "value",
              },
            ],
            comments: [],
          },
        },
      };

      ast.children.unshift(importNode);
    }
  }
}
