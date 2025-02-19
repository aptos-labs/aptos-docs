import type { AstroMarkdownOptions } from "@astrojs/markdown-remark";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import matter from "gray-matter";
import remarkRemoveAnchorLinks from "../plugins/remark-remove-anchor-links.js";
import remarkGroupMoveDefinitions from "../plugins/remark-group-move-definitions.js";
import remarkConvertCodeBlocks from "../plugins/remark-convert-codeblocks.js";
import type { ContentEntry } from "../types.js";

export class MarkdownProcessor {
  private processor: Awaited<ReturnType<typeof createMarkdownProcessor>>;

  private constructor(processor: Awaited<ReturnType<typeof createMarkdownProcessor>>) {
    this.processor = processor;
  }

  static async create(astroConfig: { markdown: AstroMarkdownOptions }): Promise<MarkdownProcessor> {
    const { remarkPlugins = [], rehypePlugins = [] } = astroConfig.markdown;

    const moveMarkdownConfig: AstroMarkdownOptions = {
      ...astroConfig.markdown,
      remarkPlugins: [
        ...remarkPlugins,
        remarkConvertCodeBlocks,
        remarkRemoveAnchorLinks,
        [
          remarkGroupMoveDefinitions,
          {
            definitionTypes: [
              { prefix: "Function", groupHeading: "Functions" },
              { prefix: "Resource", groupHeading: "Resources" },
              { prefix: "Struct", groupHeading: "Structs" },
              { prefix: "Constant", groupHeading: "Constants" },
            ],
          },
        ],
      ],
      rehypePlugins: [...rehypePlugins],
    } as const;

    const processor = await createMarkdownProcessor(moveMarkdownConfig);
    return new MarkdownProcessor(processor);
  }

  async processContent(fileName: string, content: string): Promise<ContentEntry> {
    const { data: frontmatter, content: markdownContent } = matter(content);
    const id = fileName.replace(".md", "");

    // Render Markdown
    const rendered = await this.processor.render(markdownContent);

    return {
      id,
      data: frontmatter as Record<string, unknown>,
      body: markdownContent,
      rendered: {
        html: rendered.code,
        metadata: {
          ...rendered.metadata,
        },
      },
    };
  }
}
