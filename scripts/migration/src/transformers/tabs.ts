import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class TabsTransformer extends BaseTransformer {
  protected componentNames = ["Tabs", "TabItem", "Tabs.Tab"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  getComponentMap(): Map<string, string> {
    return new Map([
      ["Tabs.Tab", "TabItem"],
      ["Tab", "TabItem"],
    ]);
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    // First pass: Transform Tabs components and extract their items
    visit(ast, "mdxJsxFlowElement", (node) => {
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

      if (itemsAttr?.value && typeof itemsAttr.value === "object" && "value" in itemsAttr.value) {
        const valueExpr = itemsAttr.value.value;
        const arrayMatch = valueExpr.match(/\[(.*?)\]/);
        if (arrayMatch) {
          const items = arrayMatch[1]
            .split(",")
            .map((item: string) => item.trim().replace(/['"]/g, ""))
            .filter(Boolean);

          if (items.length > 0) {
            // Remove all attributes from Tabs
            mdxNode.attributes = [];

            // Transform Tabs.Tab children to TabItem with corresponding labels
            let tabIndex = 0;
            const newChildren = [];

            for (const child of mdxNode.children) {
              if (
                child.type === "mdxJsxFlowElement" &&
                "name" in child &&
                (child.name === "Tabs.Tab" || child.name === "Tab")
              ) {
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
          }
        }
      }
    });

    // Second pass: Transform any remaining Tabs.Tab components to TabItem
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && (node.name === "Tabs.Tab" || node.name === "Tab")) {
        const mdxNode = node as MdxJsxFlowElement;
        mdxNode.name = "TabItem";
      }
    });
  }
}
