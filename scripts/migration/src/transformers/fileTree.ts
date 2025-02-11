import { visit } from "unist-util-visit";
import type { Root, ListItem, List, Paragraph, Text } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class FileTreeTransformer extends BaseTransformer {
  protected componentNames = ["FileTree"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if (!("name" in node) || node.name !== "FileTree") return;

      const mdxNode = node as MdxJsxFlowElement;

      // Only process if there are children
      if (mdxNode.children.length > 0) {
        // Transform children into list items
        const items = this.transformFileTreeChildren(mdxNode.children);

        // Create a text node with just a newline
        const newline: Text = {
          type: "text",
          value: "\n",
        };

        // Create a paragraph for the newline
        const newlinePara: Paragraph = {
          type: "paragraph",
          children: [newline],
        };

        // Create the root list
        const list: List = {
          type: "list",
          ordered: false,
          spread: false,
          children: items,
        };

        // Set the children to the newline and list
        mdxNode.children = [list];
      } else {
        // For empty FileTree, just add a newline
        mdxNode.children = [
          {
            type: "paragraph",
            children: [{ type: "text", value: "\n" }],
          },
        ];
      }
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
}
