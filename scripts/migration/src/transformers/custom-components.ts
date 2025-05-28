import { visit } from "unist-util-visit";
import type { Root, Paragraph } from "mdast";
import type {
  MdxJsxAttribute,
  MdxJsxFlowElement,
  MdxJsxAttributeValueExpression,
} from "mdast-util-mdx-jsx";
import type { TransformerOptions, MdxjsEsm } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class CustomComponentTransformer extends BaseTransformer {
  // Components that are not ready for use with their new import paths
  protected componentNames = [
    "ThemedImage",
    "permalinkFetch",
    "IndexerBetaNotice",
    "AptosFrameworkReference",
    "MoveReference",
    "DynamicApiReference",
    "fetchApiReference",
    // Add ready components here too so BaseTransformer doesn't try to import them"
    "YouTube",
    "Faucet",
    "GraphQLEditor",
    "NFTGraphQLEditor",
    "RemoteCodeblock",
  ];

  // Components that are ready for use with their new import paths
  protected readyComponents: Record<string, string> = {
    Faucet: "~/components/react/Faucet",
    GraphQLEditor: "~/components/react/GraphQLEditor",
    NFTGraphQLEditor: "~/components/react/GraphQLEditor", // Map to the same component
    RemoteCodeblock: "~/components/RemoteCodeblock",
    YouTube: "astro-embed",
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

  // Helper function to check if variables attribute value represents an empty object
  // FOCUS ONLY ON THE KNOWN EMPTY PATTERN FROM THE SOURCE FILE: variables={`{}`}
  private isEmptyNftVariablesAttr(attr: MdxJsxAttribute): boolean {
    if (!attr || attr.name !== "variables") return false;

    // Check specifically for the pattern variables={`{}`} which might be parsed as an expression
    if (
      typeof attr.value === "object" &&
      attr.value !== null &&
      attr.value.type === "mdxJsxAttributeValueExpression"
    ) {
      const expression = attr.value as MdxJsxAttributeValueExpression;
      if (expression.value) {
        const exprTrimmed = expression.value.trim();
        // Check if the expression itself is just '{}' or '`{}`'
        return exprTrimmed === "{}" || exprTrimmed === "`{}`";
      }
    }
    // Check for simple string value `{}`
    if (typeof attr.value === "string") {
      const trimmed = attr.value.trim();
      return trimmed === "{}";
    }

    return false;
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
        const mdxNode = node as MdxJsxFlowElement;
        let componentName = node.name;
        let isTransformedNftEditor = false;

        // Handle NFTGraphQLEditor transformation
        if (componentName === "NFTGraphQLEditor") {
          node.name = "GraphQLEditor"; // Rename the component
          componentName = "GraphQLEditor"; // Update local variable
          isTransformedNftEditor = true;
          importsNeeded.add("GraphQLEditor");

          // Process attributes ONLY for the transformed NFT editor
          if (mdxNode.attributes) {
            const originalAttributes = [...mdxNode.attributes];
            const newAttributes = [];
            let hasEndpoint = false;

            for (const attr of originalAttributes) {
              // Skip empty 'variables' attributes specifically for NFT editor transformation
              if (attr.type === "mdxJsxAttribute" && this.isEmptyNftVariablesAttr(attr)) {
                console.log(
                  "[NFT Transform] Skipping empty variables attribute:",
                  JSON.stringify(attr),
                );
                continue; // Skip this attribute
              }

              // Keep endpoint if present
              if (attr.type === "mdxJsxAttribute" && attr.name === "endpoint") {
                hasEndpoint = true;
              }

              // Keep all other attributes (including non-empty variables)
              newAttributes.push(attr);
            }

            // Add endpoint if it wasn't present
            if (!hasEndpoint) {
              newAttributes.push({
                type: "mdxJsxAttribute",
                name: "endpoint",
                value: "https://api.mainnet.aptoslabs.com/nft-aggregator-staging/v1/graphql",
              } as MdxJsxAttribute);
            }

            // Assign the processed list of attributes back to the node
            mdxNode.attributes = newAttributes;
          }
        }
        // If it's an original GraphQLEditor component, DO NOT TOUCH variables for now
        else if (componentName === "GraphQLEditor") {
          // We are not modifying original GraphQLEditor variables in this pass
          // to avoid breaking existing ones until the NFT transform is perfect.
          importsNeeded.add("GraphQLEditor");
        }
        // Handle other ready components
        else if (this.readyComponents[node.name]) {
          importsNeeded.add(node.name);
        }
        // Handle components to be commented out
        else if (this.componentNames.includes(node.name)) {
          // ... (commenting out logic remains the same)
          let nodeStr = `<${node.name}`;
          if (mdxNode.attributes && mdxNode.attributes.length > 0) {
            nodeStr +=
              " " +
              mdxNode.attributes
                .map((attr) => {
                  if (attr.type === "mdxJsxAttribute") {
                    // Handle boolean attributes correctly
                    if (attr.value === null || attr.value === undefined) {
                      return attr.name;
                    }
                    return `${attr.name}=${JSON.stringify(attr.value)}`;
                  }
                  return ""; // Handle other attribute types if necessary
                })
                .filter(Boolean) // Remove empty strings
                .join(" ");
          }

          if (mdxNode.children && mdxNode.children.length > 0) {
            nodeStr += ">";
            const childContent = mdxNode.children
              .map((child: any) => {
                if (child.type === "text") return child.value;
                if (child.type === "mdxJsxFlowElement" || child.type === "mdxJsxElement")
                  return `<${child.name} />`; // Simplified representation
                return "";
              })
              .filter(Boolean)
              .join("");
            nodeStr += childContent;
            nodeStr += `</${node.name}>`;
          } else {
            nodeStr += " />";
          }

          const commentNode = {
            type: "html",
            value: `{/* ${nodeStr} */}`,
          };
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
