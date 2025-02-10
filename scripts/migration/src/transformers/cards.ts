import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import type { TransformerOptions } from "../types/index.js";
import { BaseTransformer } from "./base.js";

export class CardsTransformer extends BaseTransformer {
  protected componentNames = ["CardGrid"];
  protected oldImportPath = "nextra/components";
  protected newImportPath = "@astrojs/starlight/components";

  getComponentMap(): Map<string, string> {
    return new Map([["Cards", "CardGrid"]]);
  }

  protected transformComponents(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && (node.name === "Cards" || node.name === "CardGrid")) {
        const mdxNode = node as MdxJsxFlowElement;
        // Transform Cards to CardGrid if needed
        if (node.name === "Cards") {
          mdxNode.name = "CardGrid";
        }
        // Remove className attribute if it exists
        mdxNode.attributes = mdxNode.attributes.filter(
          (attr) => !(attr.type === "mdxJsxAttribute" && attr.name === "className"),
        );
      }
    });
  }
}
