import type { Loader, LoaderContext } from "astro/loaders";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import matter from "gray-matter";
import { octokit } from "../lib/octokit";

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

      // Create the Markdown processor
      const processor = await createMarkdownProcessor(context.config.markdown);

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
            },
          });
        }),
      );
    },
  };
}
