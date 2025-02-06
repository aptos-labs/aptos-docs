import type { Root } from "mdast";
import type { TransformerOptions, Transformer } from "../types/index.js";
export declare class CalloutTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void;
  private removeNextraImports;
  private findAttribute;
  private transformCallouts;
  private ensureAsideImport;
  private mapCalloutType;
}
