import { visit } from "unist-util-visit";
import type { Root, Paragraph } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions, MdxjsEsm } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class CustomComponentTransformer extends BaseTransformer {
  // Components that are not ready for use with their new import paths
  protected componentNames = [
    "ThemedImage",
    "RemoteCodeblock",
    "permalinkFetch",
    "IndexerBetaNotice",
    "AptosFrameworkReference",
    "MoveReference",
    "DynamicApiReference",
    "fetchApiReference",
    "YouTube",
    // Add ready components here too so BaseTransformer doesn't try to import them
    "Faucet",
    "GraphQLEditor",
  ];

  // Components that are ready for use with their new import paths
  protected readyComponents: Record<string, string> = {
    Faucet: "~/components/react/Faucet",
    GraphQLEditor: "~/components/react/GraphQLEditor",
  };

  protected oldImportPath = "@components/index";
  // Set to empty string to prevent BaseTransformer from adding imports
  protected newImportPath = "";

  private isCustomComponentImport(value: string): boolean {
    // Remove both old @components imports and any existing imports of ready components
    return (
      value.includes("@components") ||
      Object.entries(this.readyComponents).some(
        ([name, path]) => value.includes(name) && value.includes(path),
      )
    );
  }

  getComponentMap(): Map<string, string> {
    // Return ready components as a Map
    return new Map(Object.entries(this.readyComponents));
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    // Track components that need imports
    const importsNeeded = new Set<string>();

    // First pass: remove @components/index imports
    ast.children = ast.children.filter((node) => {
      if (node.type === "mdxjsEsm") {
        // Keep the node only if it's not a custom component import
        return !this.isCustomComponentImport(node.value);
      }
      return true;
    });

    // Second pass: handle components
    visit(ast, ["mdxJsxFlowElement", "mdxJsxElement"], (node) => {
      if ("name" in node && typeof node.name === "string") {
        // If it's a ready component, keep it and track for import
        if (this.readyComponents[node.name]) {
          importsNeeded.add(node.name);
        }
        // If it's a component to be commented out
        else if (this.componentNames.includes(node.name)) {
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
      }
    });

    // Add imports for ready components that were used
    if (importsNeeded.size > 0) {
      // Find frontmatter to place imports after it
      const frontmatterIndex = ast.children.findIndex((node) => node.type === "yaml");
      const insertIndex = frontmatterIndex !== -1 ? frontmatterIndex + 1 : 0;

      // Create import nodes
      const importNodes = Array.from(importsNeeded).map((componentName) => {
        const importNode: MdxjsEsm = {
          type: "mdxjsEsm",
          value: `import { ${componentName} } from '${this.readyComponents[componentName]}';`,
          data: {
            estree: {
              type: "Program",
              sourceType: "module",
              body: [
                {
                  type: "ImportDeclaration",
                  source: {
                    type: "Literal",
                    value: this.readyComponents[componentName],
                    raw: `'${this.readyComponents[componentName]}'`,
                  },
                  specifiers: [
                    {
                      type: "ImportSpecifier",
                      imported: {
                        type: "Identifier",
                        name: componentName,
                      },
                      local: {
                        type: "Identifier",
                        name: componentName,
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
        return importNode;
      });

      // Add blank line after imports
      const blankLine: Paragraph = {
        type: "paragraph",
        children: [],
      };

      // Insert imports and blank line after frontmatter
      ast.children.splice(insertIndex, 0, ...importNodes, blankLine);
    }
  }
}
