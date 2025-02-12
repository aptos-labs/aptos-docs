import { visit, SKIP } from "unist-util-visit";
import type { Root, ListItem, List, Paragraph, Text } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class FileTreeTransformer extends BaseTransformer {
  protected componentNames = ["FileTree"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node, index, parent) => {
      if (!("name" in node) || node.name !== "FileTree" || !parent || typeof index !== "number")
        return;

      const mdxNode = node as MdxJsxFlowElement;

      // Check if there are any actual file/folder nodes
      const items = this.transformFileTreeChildren(mdxNode.children);

      if (items.length === 0) {
        // For empty FileTree or one with no valid children, remove the node from parent
        parent.children.splice(index, 1);
        return [SKIP, index];
      }

      // Create the root list
      const list: List = {
        type: "list",
        ordered: false,
        spread: false,
        children: items,
      };

      // Set the children to just the list
      mdxNode.children = [list];

      // Remove empty text nodes before and after
      const removeEmptyTextNodes = (idx: number, direction: 1 | -1) => {
        while (idx >= 0 && idx < parent.children.length) {
          const sibling = parent.children[idx];
          if (sibling.type === "text" && /^\s*$/.test(sibling.value)) {
            parent.children.splice(idx, 1);
            idx += direction;
          } else {
            break;
          }
        }
      };

      // Remove empty text nodes before
      removeEmptyTextNodes(index - 1, -1);
      // Remove empty text nodes after
      removeEmptyTextNodes(index + 1, 1);
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
