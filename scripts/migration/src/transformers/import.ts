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
        if (parsed) {
          // Skip nextra imports as we'll replace them with starlight imports
          if (!parsed.source.includes("nextra")) {
            const existingImports = importsBySource.get(parsed.source) || new Set<string>();
            parsed.specifiers.forEach((spec) => existingImports.add(spec));
            importsBySource.set(parsed.source, existingImports);
          }
        }
      }
    });

    // Add all starlight components to the imports
    if (usedComponents.size > 0) {
      const existingImports =
        importsBySource.get("'@astrojs/starlight/components'") || new Set<string>();
      usedComponents.forEach((comp) => existingImports.add(comp));
      importsBySource.set("'@astrojs/starlight/components'", existingImports);
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

    // Remove all existing imports
    const contentWithoutImports = ast.children.filter((node) => {
      if (node.type === "mdxjsEsm") {
        const parsed = this.parseImport(node.value);
        // Keep non-nextra imports that we haven't consolidated
        return parsed && !parsed.source.includes("nextra") && !importsBySource.has(parsed.source);
      }
      return true;
    });

    // Rebuild AST in correct order
    if (frontmatterEndIndex !== -1) {
      // If we have frontmatter, place imports after it
      ast.children = [
        ...contentWithoutImports.slice(0, frontmatterEndIndex + 1),
        blankLine,
        ...consolidatedImports,
        blankLine,
        ...contentWithoutImports.slice(frontmatterEndIndex + 1),
      ];
    } else {
      // If no frontmatter, place imports at the start
      ast.children = [...consolidatedImports, blankLine, ...contentWithoutImports];
    }
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
