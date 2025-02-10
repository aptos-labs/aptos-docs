import { visit } from "unist-util-visit";
import type { Root, Heading, ListItem, List, Paragraph, Text } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class StepsTransformer extends BaseTransformer {
  protected componentNames = ["Steps"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  getComponentMap(): Map<string, string> {
    return new Map();
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if (!("name" in node) || node.name !== "Steps") return;

      const mdxNode = node as MdxJsxFlowElement;
      const listItems: ListItem[] = [];
      let stepNumber = 1;

      // Process children to convert headings to list items
      for (let i = 0; i < mdxNode.children.length; i++) {
        const child = mdxNode.children[i];

        if (child.type === "heading" && (child as Heading).depth === 3) {
          // Convert heading to list item text
          const heading = child as Heading;
          const headingText = heading.children
            .map((child) => {
              if (child.type === "text") return child.value;
              if (child.type === "inlineCode") return child.value;
              return "";
            })
            .join("");

          // Collect content until next heading
          const contentChildren = [];
          i++;
          while (i < mdxNode.children.length) {
            const nextChild = mdxNode.children[i];
            if (nextChild.type === "heading" && (nextChild as Heading).depth === 3) {
              i--;
              break;
            }
            contentChildren.push(nextChild);
            i++;
          }

          // Create list item with heading text and following content
          const listItem: ListItem = {
            type: "listItem",
            spread: true, // Set spread to true to add spacing between items
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    value: headingText,
                  },
                ],
              },
              ...contentChildren,
            ],
          };

          listItems.push(listItem);
          stepNumber++;
        } else if (child.type !== "heading") {
          // Preserve non-heading content at the root level
          if (listItems.length > 0) {
            // Add to the last list item if we have one
            listItems[listItems.length - 1].children.push(child);
          }
        }
      }

      // Create ordered list
      const orderedList: List = {
        type: "list",
        ordered: true,
        start: 1,
        spread: true, // Set spread to true to add spacing between items
        children: listItems,
      };

      // Replace children with the new structure
      mdxNode.children = [orderedList];
    });
  }
}
