import type {
  Root,
  Content,
  RootContent,
  Parent,
  BlockContent,
  DefinitionContent,
  Heading,
  Yaml,
  Paragraph,
} from "mdast";
import type { Program, ImportDeclaration as ESTreeImportDeclaration } from "estree";

export interface TransformerOptions {
  /** Use component syntax instead of ::: syntax for asides/callouts */
  useComponentSyntax?: boolean;
  /** Current file path being processed */
  filePath?: string;
  /** Source path for the file */
  sourcePath?: string;
  /** Target language (en, ja, zh) */
  language?: string;
}

export interface FileTransformResult {
  content: string;
  path: string;
}

export interface Transformer {
  transform(ast: Root, options: TransformerOptions): void;
  getComponentMap(): Map<string, string>;
}

export type MdxJsxAttributeValue = string | number | boolean | null;

export interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: MdxJsxAttributeValue;
}

export interface MdxJsxExpressionAttribute {
  type: "mdxJsxExpressionAttribute";
  value: string;
}

export type MdxJsxAttributeNode = MdxJsxAttribute | MdxJsxExpressionAttribute;

export interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttributeNode[];
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

export interface YamlNode extends Yaml {
  type: "yaml";
  value: string;
}

export interface ParagraphNode extends Paragraph {
  type: "paragraph";
  children: [];
}

export type RootContentWithMdx =
  | RootContent
  | MdxjsEsm
  | MdxJsxFlowElement
  | ContainerDirective
  | YamlNode
  | ParagraphNode;

declare module "mdast" {
  interface Root {
    children: RootContentWithMdx[];
  }
}
