import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type {
  TransformerOptions,
  MdxjsEsm,
  RootContentWithMdx,
  ParagraphNode,
} from "../types/index.js";

export abstract class BaseTransformer {
  // Component names to look for (e.g., ["FileTree"] or ["Tabs", "TabItem"])
  protected abstract componentNames: string[];
  // Old import path (e.g., "nextra/components")
  protected abstract oldImportPath: string;
  // New import path (e.g., "@astrojs/starlight/components")
  protected abstract newImportPath: string;

  // Map of source component names to their target names (e.g., { "Cards": "CardGrid", "Card": "LinkCard" })
  getComponentMap(): Map<string, string> {
    return new Map();
  }

  // Helper to check if a node uses any of our components and get their target names
  protected getUsedComponents(node: any): string[] {
    if ("name" in node) {
      const componentMap = this.getComponentMap();
      const nodeName = node.name;

      // Check if this is a source component that needs to be transformed
      if (componentMap.has(nodeName)) {
        return [componentMap.get(nodeName)!];
      }

      // Check if this is already a target component
      if (this.componentNames.includes(nodeName)) {
        return [nodeName];
      }

      // Handle special cases like "Tabs.Tab"
      for (const name of this.componentNames) {
        if (nodeName.startsWith(`${name}.`)) {
          return [name];
        }
      }
    }
    return [];
  }

  transform(ast: Root, options: TransformerOptions): void {
    const usedComponents = new Set<string>();

    // Check which components are used in the document
    const checkNode = (node: any) => {
      const components = this.getUsedComponents(node);
      components.forEach((comp) => usedComponents.add(comp));

      // Check children recursively
      if (node.children) {
        node.children.forEach(checkNode);
      }
    };

    ast.children.forEach(checkNode);

    if (usedComponents.size > 0) {
      // Only process if components are present
      this.removeOldImports(ast);
      this.transformComponents(ast, options);
      this.ensureNewImport(ast, Array.from(usedComponents));
      this.addSpacingAroundComponents(ast);
    }
  }

  protected removeOldImports(ast: Root): void {
    const toRemove: number[] = [];

    visit(ast, "mdxjsEsm", (node) => {
      if (
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes(this.oldImportPath)
      ) {
        // Get all component names (both source and target)
        const allComponents = [
          ...this.componentNames,
          ...Array.from(this.getComponentMap().keys()),
        ];
        // Check if any of our components are in the import
        if (allComponents.some((name) => node.value.includes(name))) {
          const index = ast.children.indexOf(node);
          if (index !== -1) {
            toRemove.push(index);
          }
        }
      }
    });

    // Remove imports from bottom to top to avoid index shifting
    toRemove.reverse().forEach((index) => {
      ast.children.splice(index, 1);
    });
  }

  protected abstract transformComponents(ast: Root, options: TransformerOptions): void;

  protected ensureNewImport(ast: Root, usedComponents: string[]): void {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes(this.newImportPath) &&
        usedComponents.every((name) => node.value.includes(name)),
    );

    if (!hasImport) {
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: `import { ${usedComponents.join(", ")} } from '${this.newImportPath}';`,
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ImportDeclaration",
                source: {
                  type: "Literal",
                  value: this.newImportPath,
                  raw: `'${this.newImportPath}'`,
                },
                specifiers: [
                  ...usedComponents.map((name) => ({
                    type: "ImportSpecifier" as const,
                    imported: {
                      type: "Identifier" as const,
                      name,
                    },
                    local: {
                      type: "Identifier" as const,
                      name,
                    },
                  })),
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

  protected addSpacingAroundComponents(ast: Root): void {
    // Create blank line node
    const createBlankLine = (): ParagraphNode => ({
      type: "paragraph",
      children: [],
    });

    // Add spacing around components
    const newChildren: RootContentWithMdx[] = [];
    let lastWasComponent = false;

    for (let i = 0; i < ast.children.length; i++) {
      const node = ast.children[i];
      const isComponent =
        node.type === "mdxJsxFlowElement" &&
        "name" in node &&
        (this.componentNames.includes(node.name as string) ||
          this.getComponentMap().has(node.name as string));

      // Add blank line before component if previous node wasn't a component
      if (isComponent && !lastWasComponent && i > 0) {
        newChildren.push(createBlankLine());
      }

      newChildren.push(node);

      // Add blank line after component
      if (isComponent && i < ast.children.length - 1) {
        newChildren.push(createBlankLine());
      }

      lastWasComponent = isComponent;
    }

    ast.children = newChildren;
  }
}
