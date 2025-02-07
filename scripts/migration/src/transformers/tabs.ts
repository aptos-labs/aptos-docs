import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { Transformer, TransformerOptions, MdxjsEsm } from "../types/index.js";

export class TabsTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Remove old Nextra Tabs imports
    this.removeNextraTabsImports(ast);

    // Transform Tabs components
    this.transformTabs(ast);

    // Ensure Starlight Tabs imports are present
    this.ensureStarlightTabsImport(ast);
  }

  private removeNextraTabsImports(ast: Root): void {
    const toRemove: number[] = [];

    visit(ast, "mdxjsEsm", (node) => {
      if (
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("nextra/components") &&
        node.value.includes("Tabs")
      ) {
        const index = ast.children.indexOf(node);
        if (index !== -1) {
          toRemove.push(index);
        }
      }
    });

    // Remove imports from bottom to top to avoid index shifting
    toRemove.reverse().forEach((index) => {
      ast.children.splice(index, 1);
    });
  }

  private transformTabs(ast: Root): void {
    visit(ast, "mdxJsxFlowElement", (node, index, parent) => {
      if (!("name" in node) || node.name !== "Tabs") return;

      const mdxNode = node as MdxJsxFlowElement;

      // Find the items attribute
      const itemsAttr = mdxNode.attributes.find(
        (attr) =>
          attr.type === "mdxJsxAttribute" &&
          attr.name === "items" &&
          attr.value &&
          typeof attr.value === "object" &&
          "type" in attr.value &&
          attr.value.type === "mdxJsxAttributeValueExpression" &&
          "value" in attr.value &&
          typeof attr.value.value === "string",
      );

      if (!itemsAttr?.value || typeof itemsAttr.value !== "object" || !("value" in itemsAttr.value))
        return;
      const valueExpr = itemsAttr.value.value;

      // Extract array content from the expression
      const arrayMatch = valueExpr.match(/\[(.*?)\]/);
      if (!arrayMatch) return;

      const items = arrayMatch[1]
        .split(",")
        .map((item: string) => item.trim().replace(/['"]/g, ""))
        .filter(Boolean);

      if (!items.length) return;

      // Remove all attributes from Tabs
      mdxNode.attributes = [];

      // Transform Tabs.Tab children to TabItem with corresponding labels
      let tabIndex = 0;
      const newChildren = [];

      for (const child of mdxNode.children) {
        if (child.type === "mdxJsxFlowElement" && "name" in child && child.name === "Tabs.Tab") {
          if (tabIndex < items.length) {
            const label = items[tabIndex++];
            const flowChild = child as MdxJsxFlowElement;
            flowChild.name = "TabItem";
            flowChild.attributes = [
              {
                type: "mdxJsxAttribute" as const,
                name: "label",
                value: label,
              },
            ];
            newChildren.push(flowChild);
          }
        } else {
          newChildren.push(child);
        }
      }

      mdxNode.children = newChildren;
    });
  }

  private ensureStarlightTabsImport(ast: Root): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("Tabs") &&
        node.value.includes("TabItem"),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "import { Tabs, TabItem } from '@astrojs/starlight/components';",
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
                      name: "Tabs",
                    },
                    local: {
                      type: "Identifier",
                      name: "Tabs",
                    },
                  },
                  {
                    type: "ImportSpecifier",
                    imported: {
                      type: "Identifier",
                      name: "TabItem",
                    },
                    local: {
                      type: "Identifier",
                      name: "TabItem",
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
