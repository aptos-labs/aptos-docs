import { visit } from "unist-util-visit";
export class CardsTransformer {
  transform(ast, options) {
    // Remove old Cards imports
    this.removeCardsImports(ast);
    // Transform Cards components to CardGrid
    this.transformCards(ast);
    // Ensure CardGrid import is present
    this.ensureCardGridImport(ast);
  }
  removeCardsImports(ast) {
    const toRemove = [];
    visit(ast, "mdxjsEsm", (node) => {
      if ("value" in node && typeof node.value === "string" && node.value.includes("Cards")) {
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
  transformCards(ast) {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && node.name === "Cards") {
        const mdxNode = node;
        // Transform Cards to CardGrid
        mdxNode.name = "CardGrid";
        // Remove className attribute if it exists
        mdxNode.attributes = mdxNode.attributes.filter(
          (attr) => !(attr.type === "mdxJsxAttribute" && attr.name === "className"),
        );
      }
    });
  }
  ensureCardGridImport(ast) {
    const hasImport = ast.children.some(
      (node) =>
        node.type === "mdxjsEsm" &&
        "value" in node &&
        typeof node.value === "string" &&
        node.value.includes("@astrojs/starlight/components") &&
        node.value.includes("CardGrid"),
    );
    if (!hasImport) {
      const importNode = {
        type: "mdxjsEsm",
        value: "import { CardGrid } from '@astrojs/starlight/components';",
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
                      name: "CardGrid",
                    },
                    local: {
                      type: "Identifier",
                      name: "CardGrid",
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
}
