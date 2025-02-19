import type { Loader, LoaderContext } from "astro/loaders";
import type { AstroMarkdownOptions } from "@astrojs/markdown-remark";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import matter from "gray-matter";
import { octokit } from "../../lib/octokit.js";
import remarkRemoveAnchorLinks from "./plugins/remark-remove-anchor-links.js";
import remarkGroupMoveDefinitions from "./plugins/remark-group-move-definitions.js";
import remarkConvertCodeBlocks from "./plugins/remark-convert-codeblocks.js";

interface GitHubConfig {
  owner: string;
  repo: string;
  ref: string;
  folder: string;
}

export function moveReferenceLoader(config: GitHubConfig): Loader {
  return {
    name: `move-reference`,
    load: async (context: LoaderContext) => {
      const { store, logger } = context;
      logger.info(`Pulling content from GitHub: ${config.folder}`);

      // Fetch folder content from GitHub
      const response = await octokit.rest.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        ref: config.ref,
        path: config.folder,
      });

      if (!Array.isArray(response.data)) {
        logger.warn(`No content found at ${config.folder}`);
        return;
      }

      // Clear existing store before loading new content TODO: implement header-based cache control to avoid clearing store as seen here: https://astro.build/blog/content-layer-deep-dive/
      store.clear();

      // Create the Markdown processor with Move-specific plugins
      const baseConfig = context.config.markdown;
      const moveMarkdownConfig: AstroMarkdownOptions = {
        ...baseConfig,
        remarkPlugins: [
          ...baseConfig.remarkPlugins,
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
        rehypePlugins: [...baseConfig.rehypePlugins],
      } as const;

      const processor = await createMarkdownProcessor(moveMarkdownConfig);

      // Process each file in the folder
      await Promise.all(
        response.data.map(async (file) => {
          // Fetch individual file content
          const { data } = await octokit.rest.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: `${config.folder}/${file.name}`,
          });

          // Decode base64 content if available
          const fileContent =
            "content" in data ? Buffer.from(data.content, "base64").toString("utf-8") : "";

          // Parse frontmatter and content using `gray-matter`
          const { data: frontmatter, content } = matter(fileContent);

          // Parse data
          const parsedData = await context.parseData({
            id: file.name.replace(".md", ""),
            data: frontmatter,
          });

          const digest = context.generateDigest(content);

          // Render Markdown
          const rendered = await processor.render(content);

          // Store processed content
          store.set({
            id: file.name.replace(".md", ""),
            data: parsedData,
            digest,
            rendered: {
              html: rendered.code,
              metadata: rendered.metadata,
            },
          });
        }),
      );
    },
  };
}
