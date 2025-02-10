import type { Root } from "mdast";
import type { TransformerOptions, Transformer } from "../types/index.js";

export class FrontmatterTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // No transformation needed yet
  }

  getComponentMap(): Map<string, string> {
    return new Map();
  }
}
