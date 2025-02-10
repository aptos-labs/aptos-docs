import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class CustomComponentTransformer extends BaseTransformer {
  protected componentNames = [
    "ThemedImage",
    "GraphQLEditor",
    "RemoteCodeblock",
    "permalinkFetch",
    "IndexerBetaNotice",
    "AptosFrameworkReference",
    "MoveReference",
    "DynamicApiReference",
    "fetchApiReference",
  ];
  protected oldImportPath = "@components/index";
  protected newImportPath = "";

  private isCustomComponentImport(value: string): boolean {
    return value.includes("@components/index") || value.includes("components/index");
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    // First pass: remove @components/index imports
    ast.children = ast.children.filter((node) => {
      if (node.type === "mdxjsEsm") {
        // Keep the node only if it's not a custom component import
        return !this.isCustomComponentImport(node.value);
      }
      return true;
    });

    // Second pass: comment out component usage
    visit(ast, "mdxJsxFlowElement", (node) => {
      if (
        "name" in node &&
        typeof node.name === "string" &&
        this.componentNames.includes(node.name)
      ) {
        const mdxNode = node as MdxJsxFlowElement;

        // Convert node to string representation
        let nodeStr = `<${node.name}`;
        if (mdxNode.attributes && mdxNode.attributes.length > 0) {
          nodeStr +=
            " " +
            mdxNode.attributes
              .map((attr) => {
                if (attr.type === "mdxJsxAttribute") {
                  return `${attr.name}=${JSON.stringify(attr.value)}`;
                }
                return "";
              })
              .join(" ");
        }
        nodeStr += ">";

        if (mdxNode.children && mdxNode.children.length > 0) {
          nodeStr += "..."; // Placeholder for children
        }

        nodeStr += `</${node.name}>`;

        // Create a text node with the commented content
        const commentNode = {
          type: "html",
          value: `{/* ${nodeStr} */}`,
        };

        // Replace the original node properties
        Object.assign(node, commentNode);
      }
    });
  }
}
