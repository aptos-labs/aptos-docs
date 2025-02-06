import type { Root } from "mdast";
import type {
  Transformer,
  TransformerOptions,
  RootContentWithMdx,
  ParagraphNode,
} from "../types/index.js";

export class ImportTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Collect nodes by type
    const imports: RootContentWithMdx[] = [];
    const frontmatter: RootContentWithMdx[] = [];
    const content: RootContentWithMdx[] = [];

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
      const blankLine: ParagraphNode = {
        type: "paragraph",
        children: [],
      };

      // Rebuild AST in correct order
      ast.children = [...frontmatter, blankLine, ...imports, blankLine, ...content];
    }
  }
}
