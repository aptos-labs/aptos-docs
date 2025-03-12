import type { Root } from "mdast";
import type {
  Transformer,
  TransformerOptions,
  RootContentWithMdx,
  ParagraphNode,
  MdxjsEsm,
} from "../types/index.js";

interface ParsedImport {
  source: string;
  specifiers: string[];
}

export class ImportTransformer implements Transformer {
  private componentMappings: Map<string, string>;

  constructor(componentMappings: Map<string, string>) {
    this.componentMappings = componentMappings;
  }

  private isCustomComponentImport(source: string): boolean {
    return source.includes("@components/index") || source.includes("components/index");
  }

  transform(ast: Root, options: TransformerOptions): void {
    // Find used components recursively
    const usedComponents = new Set<string>();
    const checkNode = (node: any) => {
      if (node.type === "mdxJsxFlowElement" && "name" in node && node.name) {
        // If it's a mapped component, add the target component
        if (this.componentMappings.has(node.name)) {
          usedComponents.add(this.componentMappings.get(node.name)!);
        }
        // If it's already a target component, add it directly
        else if (
          ["CardGrid", "LinkCard", "TabItem", "Tabs", "Steps", "FileTree", "Aside"].includes(
            node.name,
          )
        ) {
          usedComponents.add(node.name);
        }
      }
      if (node.children) {
        node.children.forEach(checkNode);
      }
    };
    ast.children.forEach(checkNode);

    // Find frontmatter end index
    let frontmatterEndIndex = -1;
    ast.children.forEach((node, index) => {
      if (node.type === "yaml") {
        frontmatterEndIndex = index;
      }
    });

    // Parse existing imports and collect specifiers by source
    const importsBySource = new Map<string, Set<string>>();
    ast.children.forEach((node) => {
      if (node.type === "mdxjsEsm") {
        const parsed = this.parseImport(node.value);
        if (parsed && parsed.source && parsed.source !== "''" && parsed.source !== '""') {
          // Skip nextra and old components/index imports
          if (!parsed.source.includes("nextra") && !this.isCustomComponentImport(parsed.source)) {
            // Check if this is a custom component import path (~/components/react/...)
            if (parsed.source.includes("~/components/react/")) {
              // Keep custom component imports as-is
              const existingImports = importsBySource.get(parsed.source) || new Set<string>();
              parsed.specifiers.forEach((spec) => existingImports.add(spec));
              importsBySource.set(parsed.source, existingImports);
            } else {
              // For other imports, consolidate by source
              const existingImports = importsBySource.get(parsed.source) || new Set<string>();
              parsed.specifiers.forEach((spec) => existingImports.add(spec));
              importsBySource.set(parsed.source, existingImports);
            }
          }
        }
      }
    });

    // Add starlight components to the imports (but not custom components)
    if (usedComponents.size > 0) {
      const starlightComponents = Array.from(usedComponents).filter(
        (comp) => !Array.from(this.componentMappings.values()).includes(comp),
      );
      if (starlightComponents.length > 0) {
        const existingImports =
          importsBySource.get("'@astrojs/starlight/components'") || new Set<string>();
        starlightComponents.forEach((comp) => existingImports.add(comp));
        importsBySource.set("'@astrojs/starlight/components'", existingImports);
      }
    }

    // Create consolidated import nodes
    const consolidatedImports: MdxjsEsm[] = [];
    importsBySource.forEach((specifiers, source) => {
      const sortedSpecifiers = Array.from(specifiers).sort();
      const importNode: MdxjsEsm = {
        type: "mdxjsEsm",
        value: `import { ${sortedSpecifiers.join(", ")} } from ${source};`,
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [
              {
                type: "ImportDeclaration",
                source: {
                  type: "Literal",
                  value: source.replace(/['"]/g, ""),
                  raw: source,
                },
                specifiers: sortedSpecifiers.map((name) => ({
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
                importKind: "value",
              },
            ],
            comments: [],
          },
        },
      };
      consolidatedImports.push(importNode);
    });

    // Create blank line node
    const blankLine: ParagraphNode = {
      type: "paragraph",
      children: [],
    };

    // First, remove all existing imports
    const contentWithoutImports = ast.children.filter((node) => node.type !== "mdxjsEsm");

    // Find the frontmatter node index
    const frontmatterIndex = contentWithoutImports.findIndex((node) => node.type === "yaml");

    // Create new AST structure
    const newChildren = [];

    if (frontmatterIndex !== -1) {
      // Add everything up to and including frontmatter
      newChildren.push(...contentWithoutImports.slice(0, frontmatterIndex + 1));
      // Add blank line
      newChildren.push(blankLine);
      // Add imports
      newChildren.push(...consolidatedImports);
      // Add blank line
      newChildren.push(blankLine);
      // Add remaining content
      newChildren.push(...contentWithoutImports.slice(frontmatterIndex + 1));
    } else {
      // If no frontmatter, add imports at start
      newChildren.push(...consolidatedImports);
      newChildren.push(blankLine);
      newChildren.push(...contentWithoutImports);
    }

    // Replace AST children with new structure
    ast.children = newChildren;
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }

  private parseImport(value: string): ParsedImport | null {
    // Match import statements like: import { X, Y } from 'source';
    const match = value.match(/import\s*{\s*([^}]+)\s*}\s*from\s*(['"].*['"])/);
    if (!match) return null;

    const [, specifiersStr, source] = match;
    const specifiers = specifiersStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return { source, specifiers };
  }
}
