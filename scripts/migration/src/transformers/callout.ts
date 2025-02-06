import { visit } from "unist-util-visit";
import type { Root, Parent } from "mdast";
import type {
  CalloutNode,
  CalloutType,
  MdxjsEsm,
  TransformerOptions,
  Transformer,
  ContainerDirective,
  MdxJsxFlowElement,
  RootContentWithMdx,
  NodeVisitor,
} from "../types/index.js";

export class CalloutTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Remove Nextra component imports
    this.removeNextraImports(ast);

    // Transform Callout components
    this.transformCallouts(ast, options);
  }

  private removeNextraImports(ast: Root): void {
    const toRemove: number[] = [];

    visit(ast, "mdxjsEsm", (node) => {
      if (
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("nextra/components") &&
        node.value.includes("Callout")
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

  private transformCallouts(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node, index, parent) => {
      if ("name" in node && node.name === "Callout" && parent && typeof index === "number") {
        const calloutNode = node as CalloutNode;
        const typeAttr = calloutNode.attributes?.find((attr) => attr.name === "type");
        const type = this.mapCalloutType(typeAttr?.value?.toString() || "default");

        const titleAttr = calloutNode.attributes?.find((attr) => attr.name === "title");
        const title = titleAttr?.value?.toString();

        if (options.useComponentSyntax) {
          // Transform to Starlight Aside component
          calloutNode.name = "Aside";
          calloutNode.attributes = (calloutNode.attributes || []).filter(
            (attr) => !["emoji"].includes(attr.name),
          );

          // Update type attribute if it exists
          const existingType = calloutNode.attributes.find((attr) => attr.name === "type");
          if (existingType) {
            existingType.value = type;
          } else {
            calloutNode.attributes.push({
              type: "mdxJsxAttribute",
              name: "type",
              value: type,
            });
          }

          // Add import statement if not already present
          this.ensureAsideImport(ast);
        } else {
          // Transform to ::: syntax
          const replacement: ContainerDirective = {
            type: "containerDirective",
            name: type,
            children: calloutNode.children || [],
          };

          if (title) {
            replacement.data = {
              hName: "div",
              hProperties: {
                className: [`starlight-aside ${type}`],
                "data-title": title,
              },
            };
          }

          parent.children[index] = replacement;
        }
      }
    });
  }

  private ensureAsideImport(ast: Root): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("Aside"),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: "import { Aside } from '@astrojs/starlight/components';",
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
                      name: "Aside",
                    },
                    local: {
                      type: "Identifier",
                      name: "Aside",
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

  private mapCalloutType(type: string = "default"): CalloutType {
    const mappedType = type.toLowerCase();
    return mappedType in CALLOUT_TYPE_MAP ? CALLOUT_TYPE_MAP[mappedType] : CALLOUT_TYPE_MAP.default;
  }
}

const CALLOUT_TYPE_MAP: Record<string, CalloutType> = {
  warning: "caution",
  info: "note",
  error: "danger",
  default: "note",
};
