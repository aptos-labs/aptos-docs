import type { Root, Content, RootContent, Parent, BlockContent, DefinitionContent } from "mdast";
import type { Program, ImportDeclaration as ESTreeImportDeclaration } from "estree";

export interface TransformerOptions {
  /** Use component syntax instead of ::: syntax for asides/callouts */
  useComponentSyntax?: boolean;
}

export interface FileTransformResult {
  content: string;
  path: string;
}

export interface Transformer {
  transform: (ast: Root, options: TransformerOptions) => void;
}

export type MdxJsxAttributeValue = string | number | boolean | null;

export interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: MdxJsxAttributeValue;
}

export interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: (BlockContent | DefinitionContent)[];
}

export interface CalloutNode extends Omit<MdxJsxFlowElement, "name"> {
  name: "Callout" | "Aside";
}

export interface MdxImportData {
  estree: Program & {
    body: ESTreeImportDeclaration[];
    sourceType: "module";
  };
}

export interface MdxjsEsm {
  type: "mdxjsEsm";
  value: string;
  data: MdxImportData;
}

export type CalloutType = "note" | "tip" | "caution" | "danger";

export const CALLOUT_TYPE_MAP: Record<string, CalloutType> = {
  warning: "caution",
  info: "note",
  error: "danger",
  default: "note",
};

export interface ContainerDirective extends Parent {
  type: "containerDirective";
  name: string;
  children: (BlockContent | DefinitionContent)[];
  data?: {
    hName: string;
    hProperties: {
      className: string[];
      "data-title"?: string;
    };
  };
}

export type RootContentWithMdx = RootContent | MdxjsEsm | MdxJsxFlowElement | ContainerDirective;

declare module "mdast" {
  interface Root {
    children: RootContentWithMdx[];
  }
}

export type NodeVisitor<T> = (node: T, index?: number, parent?: Root | Parent) => void;
