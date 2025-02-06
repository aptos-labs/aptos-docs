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
      // Create blank line node
      const blankLine = {
        type: "paragraph",
        children: [],
      };
      // Rebuild AST in correct order
      ast.children = [...frontmatter, blankLine, ...imports, blankLine, ...content];
    }
  }
}
