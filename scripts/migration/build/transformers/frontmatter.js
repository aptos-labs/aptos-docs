export class FrontmatterTransformer {
  transform(ast, options) {
    // Find frontmatter node
    const frontmatterIndex = ast.children.findIndex((node) => node.type === "yaml");
    if (frontmatterIndex !== -1) {
      const frontmatterNode = ast.children[frontmatterIndex];
      // Replace 'searchable: false' with 'pagefind: false'
      if (frontmatterNode.value.includes("searchable: false")) {
        frontmatterNode.value = frontmatterNode.value.replace(
          "searchable: false",
          "pagefind: false",
        );
      }
    }
  }
}
