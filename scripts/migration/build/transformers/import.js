export class ImportTransformer {
  transform(ast, options) {
    // Collect nodes by type
    const imports = [];
    const frontmatter = [];
    const content = [];
    ast.children.forEach((node) => {
      if (node.type === "mdxjsEsm") {
        imports.push(node);
      } else if (node.type === "yaml") {
        frontmatter.push(node);
      } else {
        content.push(node);
      }
    });
    // Only proceed if we have imports to handle
    if (imports.length > 0) {
      // Parse and consolidate imports
      const importsBySource = new Map();
      imports.forEach((node) => {
        if (node.type === "mdxjsEsm" && "value" in node) {
          const parsed = this.parseImport(node.value);
          if (parsed) {
            const existing = importsBySource.get(parsed.source) || new Set();
            parsed.specifiers.forEach((spec) => existing.add(spec));
            importsBySource.set(parsed.source, existing);
          }
        }
      });
      // Create consolidated import nodes
      const consolidatedImports = [];
      importsBySource.forEach((specifiers, source) => {
        const sortedSpecifiers = Array.from(specifiers).sort();
        const importNode = {
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
                    type: "ImportSpecifier",
                    imported: {
                      type: "Identifier",
                      name,
                    },
                    local: {
                      type: "Identifier",
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
      const blankLine = {
        type: "paragraph",
        children: [],
      };
      // Rebuild AST in correct order with consolidated imports
      ast.children = [...frontmatter, blankLine, ...consolidatedImports, blankLine, ...content];
    }
  }
  parseImport(value) {
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
