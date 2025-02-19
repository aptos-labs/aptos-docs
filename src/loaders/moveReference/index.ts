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

interface GitHubFileContent {
  type: "file";
  name: string;
  path: string;
  content: string;
}

interface GitHubResponse {
  status: number;
  headers: {
    etag?: string;
  };
  data: GitHubFileContent | GitHubFileContent[];
}

interface ContentEntry {
  id: string;
  data: Record<string, unknown>;
  body: string;
  rendered: {
    html: string;
    metadata: Record<string, unknown>;
  };
}

export function moveReferenceLoader(config: GitHubConfig): Loader {
  async function loadContent(context: LoaderContext, retryCount = 0): Promise<void> {
    const { store, logger, meta, config: astroConfig } = context;

    // Force a refresh
    // meta.delete("folder-etag");

    // Prevent infinite recursion
    if (retryCount > 1) {
      throw new Error("Too many retry attempts");
    }

    logger.info(`Pulling content from GitHub: ${config.folder}`);

    // Check current store state
    const entries = store.entries();
    const hasContent = entries.length > 0;

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Store entries: ${entries.length}`);

    // Force refresh if store is empty
    if (!hasContent) {
      logger.info("Store is empty, forcing refresh");
      meta.delete("folder-etag");
    }

    try {
      // Check if there's an ETag already stored
      const folderEtag = meta.get("folder-etag");
      const headers = folderEtag ? { "if-none-match": folderEtag } : {};

      // Fetch folder content from GitHub
      const folderResponse = (await octokit.rest.repos.getContent({
        owner: config.owner,
        repo: config.repo,
        ref: config.ref,
        path: config.folder,
        headers,
      })) as GitHubResponse;

      // Skip processing if content hasn't changed and we have existing entries
      if (hasContent && folderResponse.status === 304) {
        logger.info("Content not modified, using existing content");
        return;
      }

      // Store the new ETag for future requests
      const { etag } = folderResponse.headers;
      if (etag) {
        meta.set("folder-etag", etag);
      }

      // Validate response data
      if (!Array.isArray(folderResponse.data)) {
        logger.warn(`No content found at ${config.folder}`);
        return;
      }

      // Create the Markdown processor with Move-specific plugins
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

      // Clear the store before inserting new entries
      store.clear();

      // Process each file in the folder
      for (const file of folderResponse.data) {
        try {
          // Fetch individual file content
          const fileResponse = (await octokit.rest.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: `${config.folder}/${file.name}`,
          })) as GitHubResponse;

          // Process the file content
          const fileData = fileResponse.data as GitHubFileContent;
          if (!fileData.content) {
            continue;
          }

          const fileContent = Buffer.from(fileData.content, "base64").toString("utf-8");
          const { data: frontmatter, content } = matter(fileContent);
          const id = file.name.replace(".md", "");

          // Render Markdown
          const rendered = await processor.render(content);

          // Store processed content
          const entry: ContentEntry = {
            id,
            data: frontmatter as Record<string, unknown>,
            body: content,
            rendered: {
              html: rendered.code,
              metadata: {
                ...rendered.metadata,
              },
            },
          };

          store.set(entry);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Error processing file ${file.name}: ${message}`);
          // Continue with other files even if one fails
        }
      }
    } catch (error) {
      // Handle GitHub API errors
      if (error instanceof Error) {
        // If we get a 304 and have content, use the cached content
        if (error.message === "Not modified" && hasContent) {
          logger.info("Content not modified, using existing content");
          return;
        }

        // If we get a 304 but have no content, retry with cleared ETag
        if (error.message === "Not modified" && !hasContent) {
          logger.info("Got 304 but store is empty, clearing ETag to force refresh");
          meta.delete("folder-etag");
          return loadContent(context, retryCount + 1);
        }

        // For other errors, log and rethrow
        logger.error(`Error in moveReferenceLoader: ${error.message}`);
        throw error;
      }

      // For non-Error objects, convert to string
      const message = String(error);
      logger.error(`Error in moveReferenceLoader: ${message}`);
      throw new Error(message);
    }
  }

  return {
    name: "move-reference",
    load: (context) => loadContent(context),
  };
}
