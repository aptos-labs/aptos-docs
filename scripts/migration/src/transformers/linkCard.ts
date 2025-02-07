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

    // Helper to extract text from a node's children
    const extractText = (node: any): string => {
      let text = "";
      visit(node, (child: any) => {
        // Handle text nodes
        if (child.type === "text") {
          text = child.value || "";
          return false; // Stop after finding text
        }
        // Handle paragraph nodes
        if (child.type === "paragraph" && child.children) {
          text = child.children
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.value || "")
            .join("");
          return false; // Stop after finding paragraph text
        }
      });
      return text.trim();
    };

    // Find all Card.Title and Card.Description elements
    visit(node, (node: any) => {
      if (!("name" in node)) return;

      if (node.name === "Card.Title") {
        title = extractText(node);
        console.log("Found Card.Title:", title);
      } else if (node.name === "Card.Description") {
        description = extractText(node);
        console.log("Found Card.Description:", description);
      }
    });

    console.log("Found elements:", { title, description });
    return { title, description };
  }

  private transformLinkCards(ast: Root): void {
    // First transform all Cards to LinkCards
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

        console.log("Final extracted values:", { href, title, description });

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

    // Then clean up CardGrid nodes
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && node.name === "CardGrid") {
        // Keep only LinkCard elements with no spacing
        node.children = node.children.filter(
          (child: any) => child.type === "mdxJsxFlowElement" && child.name === "LinkCard",
        );
      }
    });
  }

  private ensureLinkCardImport(ast: Root): void {
    // Find existing imports from @astrojs/starlight/components
    const existingImport = ast.children.find(
      (node): node is MdxjsEsm =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components"),
    );

    if (existingImport) {
      // If import exists but doesn't include LinkCard, add it
      if (!existingImport.value.includes("LinkCard")) {
        existingImport.value = existingImport.value.replace(
          /import {([^}]*)} from '@astrojs\/starlight\/components'/,
          (match, imports) => `import {${imports}, LinkCard} from '@astrojs/starlight/components'`,
        );
      }
    } else {
      // Add new import if none exists
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
                    imported: { type: "Identifier", name: "LinkCard" },
                    local: { type: "Identifier", name: "LinkCard" },
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
