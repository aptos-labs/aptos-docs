import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { TransformerOptions, CalloutNode } from "../types/index.js";
import type { Transformer } from "../types/index.js";

const CALLOUT_TYPE_MAP: Record<string, string> = {
  warning: "caution",
  info: "note",
  error: "danger",
  default: "note",
};

export class CalloutTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    visit(ast, "mdxJsxFlowElement", (node) => {
      if ("name" in node && (node.name === "Callout" || node.name === "Aside")) {
        const calloutNode = node as CalloutNode;

        // Find type attribute
        const typeAttr = calloutNode.attributes.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === "type",
        );

        // Map type to Starlight equivalent
        const type = typeAttr?.value
          ? CALLOUT_TYPE_MAP[typeAttr.value.toString().toLowerCase()] || CALLOUT_TYPE_MAP.default
          : CALLOUT_TYPE_MAP.default;

        // Update type attribute
        if (typeAttr) {
          typeAttr.value = type;
        } else {
          calloutNode.attributes.push({
            type: "mdxJsxAttribute",
            name: "type",
            value: type,
          });
        }

        // Update component name to Aside
        calloutNode.name = "Aside";
      }
    });
  }

  getComponentMap(): Map<string, string> {
    return new Map([
      ["Callout", "Aside"],
      ["Aside", "Aside"],
    ]);
  }
}
