import type { Root } from "mdast";
import type { Transformer, TransformerOptions } from "../types/index.js";
export declare class TitleTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void;
}
