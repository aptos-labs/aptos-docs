import { visit } from "unist-util-visit";
import type { Root, Heading } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { Transformer, TransformerOptions, MdxjsEsm } from "../types/index.js";

export class StepsTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Remove old Nextra Steps imports
    this.removeNextraStepsImports(ast);

    // Transform Steps components
    this.transformSteps(ast);

    // Ensure Starlight Steps imports are present
    this.ensureStarlightStepsImport(ast);
  }

  private removeNextraStepsImports(ast: Root): void {
    const toRemove: number[] = [];

    visit(ast, "mdxjsEsm", (node) => {
      if (
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("nextra/components") &&
        node.value.includes("Steps")
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

  private transformSteps(ast: Root): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if (!("name" in node) || node.name !== "Steps") return;

      console.log("\n=== Found Steps Component ===");
      console.log("Node structure:", JSON.stringify(node, null, 2));

      const mdxNode = node as MdxJsxFlowElement;
      console.log("\nChildren:", JSON.stringify(mdxNode.children, null, 2));

      const newChildren = [];
      let stepNumber = 1;

      // Process children to convert headings to list items
      for (let i = 0; i < mdxNode.children.length; i++) {
        const child = mdxNode.children[i];

        console.log("\nProcessing child:", JSON.stringify(child, null, 2));

        if (child.type === "heading" && (child as Heading).depth === 3) {
          console.log("Found heading level 3");
          // Convert heading to list item
          const heading = child as Heading;
          const headingText = heading.children
            .map((child) => {
              if (child.type === "text") return child.value;
              if (child.type === "inlineCode") return child.value;
              return "";
            })
            .join("");
          console.log("Heading text:", headingText);
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
          const listItem = {
            type: "listItem" as const,
            spread: false,
            children: [
              {
                type: "paragraph" as const,
                children: [
                  {
                    type: "text" as const,
                    value: headingText,
                  },
                ],
              },
              ...contentChildren,
            ],
          };

          console.log("\nCreated list item:", JSON.stringify(listItem, null, 2));
          newChildren.push(listItem);
          stepNumber++;
        } else if (child.type !== "heading") {
          // Preserve non-heading content at the root level
          newChildren.push(child);
        }
      }

      // Create ordered list to wrap the items
      const orderedList = {
        type: "list" as const,
        ordered: true,
        start: 1,
        spread: false,
        children: newChildren.filter((child) => child.type === "listItem"),
      };

      console.log("\nFinal ordered list:", JSON.stringify(orderedList, null, 2));

      // Replace children with the new structure
      mdxNode.children = [orderedList];

      console.log("\nFinal node structure:", JSON.stringify(mdxNode, null, 2));
    });
  }

  private ensureStarlightStepsImport(ast: Root): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("Steps"),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "import { Steps } from '@astrojs/starlight/components';",
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
                      name: "Steps",
                    },
                    local: {
                      type: "Identifier",
                      name: "Steps",
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
