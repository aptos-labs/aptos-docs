import { visit } from "unist-util-visit";
import type { Root, ListItem, List, Paragraph, Text } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { Transformer, TransformerOptions, MdxjsEsm } from "../types/index.js";

export class FileTreeTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Remove old Nextra FileTree imports
    this.removeNextraFileTreeImports(ast);

    // Transform FileTree components
    this.transformFileTrees(ast);

    // Ensure Starlight FileTree imports are present
    this.ensureStarlightFileTreeImport(ast);
  }

  private removeNextraFileTreeImports(ast: Root): void {
    const toRemove: number[] = [];

    visit(ast, "mdxjsEsm", (node) => {
      if (
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("nextra/components") &&
        node.value.includes("FileTree")
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

  private transformFileTrees(ast: Root): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if (!("name" in node) || node.name !== "FileTree") return;

      const mdxNode = node as MdxJsxFlowElement;

      console.log("\n=== FileTree Component Found ===");
      console.log("Original children:", JSON.stringify(mdxNode.children, null, 2));

      // Transform children into list items
      const rootItems = this.transformFileTreeChildren(mdxNode.children);

      // Create the root list
      const rootList: List = {
        type: "list",
        ordered: false,
        spread: false,
        children: rootItems,
      };

      // Set the children to the list
      mdxNode.children = [rootList];

      console.log("\nFinal structure:", JSON.stringify(mdxNode, null, 2));
    });
  }

  private transformFileTreeChildren(children: (MdxJsxFlowElement | any)[]): ListItem[] {
    return children
      .filter(
        (child): child is MdxJsxFlowElement =>
          child.type === "mdxJsxFlowElement" &&
          (child.name === "FileTree.File" || child.name === "FileTree.Folder"),
      )
      .map((child) => {
        const name = this.getNameAttribute(child.attributes);
        if (!name) return null;

        // Create the text node for the file/folder name
        const text: Text = {
          type: "text",
          value: name + (child.name === "FileTree.Folder" ? "/" : ""),
        };

        // Create the paragraph
        const paragraph: Paragraph = {
          type: "paragraph",
          children: [text],
        };

        // Create the list item
        const listItem: ListItem = {
          type: "listItem",
          spread: false,
          children: [paragraph],
        };

        // If this is a folder with children, add them as a nested list
        if (child.name === "FileTree.Folder" && child.children?.length > 0) {
          const nestedList: List = {
            type: "list",
            ordered: false,
            spread: false,
            children: this.transformFileTreeChildren(child.children),
          };
          listItem.children.push(nestedList);
        }

        return listItem;
      })
      .filter((item): item is ListItem => item !== null);
  }

  private getNameAttribute(attributes: (MdxJsxAttribute | any)[]): string | null {
    const nameAttr = attributes.find(
      (attr) =>
        attr.type === "mdxJsxAttribute" && attr.name === "name" && typeof attr.value === "string",
    );
    return nameAttr?.value || null;
  }

  private ensureStarlightFileTreeImport(ast: Root): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("FileTree"),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "import { FileTree } from '@astrojs/starlight/components';",
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
                      name: "FileTree",
                    },
                    local: {
                      type: "Identifier",
                      name: "FileTree",
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
