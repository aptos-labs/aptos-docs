import type { Root } from "mdast";
import type { Transformer, TransformerOptions } from "../types/index.js";
export declare class CardsTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void;
  private removeCardsImports;
  private transformCards;
  private ensureCardGridImport;
}
