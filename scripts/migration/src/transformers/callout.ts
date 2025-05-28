import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type {
  TransformerOptions,
  CalloutNode,
  MdxJsxFlowElement,
  MdxJsxAttributeNode,
} from "../types/index.js";
import type { Transformer } from "../types/index.js";

const CALLOUT_TYPE_MAP: Record<string, string> = {
  warning: "caution",
  info: "note",
  error: "danger",
  default: "note",
};

// Type guard to check if a node is a CalloutNode or similar structure
function isCalloutLike(node: any): node is {
  name: string;
  attributes: MdxJsxAttributeNode[];
  type: string;
} {
  return (
    node &&
    typeof node === "object" &&
    "name" in node &&
    (node.name === "Callout" || node.name === "Aside") &&
    "attributes" in node &&
    Array.isArray(node.attributes)
  );
}

export class CalloutTransformer implements Transformer {
  transform(ast: Root, options: TransformerOptions): void {
    // Process all node types that might contain Callout or Aside components
    visit(ast, (node) => {
      if (isCalloutLike(node)) {
        this.transformCalloutNode(node);
      }
    });

    // Add specific debug logging for the processor-test.mdx file
    if (options.filePath && options.filePath.includes("processor-test.mdx")) {
      console.log("Processing processor-test.mdx");

      // Log all nodes to help debug
      visit(ast, (node) => {
        if ("name" in node) {
          console.log(`Found node with name ${node.name}, type: ${node.type}`);
        }
      });
    }
  }

  transformCalloutNode(node: {
    name: string;
    attributes: MdxJsxAttributeNode[];
    type: string;
  }): void {
    // Find type attribute
    const typeAttr = node.attributes.find(
      (attr) => attr.type === "mdxJsxAttribute" && attr.name === "type",
    );

    // Map type to Starlight equivalent
    const type = typeAttr?.value
      ? CALLOUT_TYPE_MAP[String(typeAttr.value).toLowerCase()] || CALLOUT_TYPE_MAP.default
      : CALLOUT_TYPE_MAP.default;

    // Update type attribute
    if (typeAttr) {
      typeAttr.value = type;
    } else {
      node.attributes.push({
        type: "mdxJsxAttribute",
        name: "type",
        value: type,
      });
    }

    // Update component name to Aside
    node.name = "Aside";
  }

  getComponentMap(): Map<string, string> {
    return new Map([
      ["Callout", "Aside"],
      ["Aside", "Aside"],
    ]);
  }
}
