import type { Root } from "mdast";
import type { Transformer, TransformerOptions, YamlNode } from "../types/index.js";

export class FrontmatterTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Find frontmatter node
    const frontmatterIndex = ast.children.findIndex((node) => node.type === "yaml");

    if (frontmatterIndex !== -1) {
      const frontmatterNode = ast.children[frontmatterIndex] as YamlNode;

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
