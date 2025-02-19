import type { Loader, LoaderContext } from "astro/loaders";
import type { GitHubConfig } from "./types";
import { GitHubFetcher } from "./services/github-fetcher";
import { MarkdownProcessor } from "./services/markdown-processor";

export function moveReferenceLoader(config: GitHubConfig): Loader {
  async function loadContent(context: LoaderContext): Promise<void> {
    const { store, logger } = context;

    logger.info(`Pulling content from GitHub: ${config.folder}`);

    // Initialize services
    const githubFetcher = new GitHubFetcher(config, context);
    const markdownProcessor = await MarkdownProcessor.create(context.config);

    try {
      // Get folder content from GitHub
      const files = await githubFetcher.getFolderContent();

      // If no files returned, it means we're using cached content
      if (files.length === 0) {
        return;
      }

      // Clear the store before inserting new entries
      store.clear();

      // Process each file in the folder
      for (const file of files) {
        const fileContent = await githubFetcher.getFileContent(file.name);

        if (!fileContent) {
          logger.warn(`No content found for file: ${file.name}`);
          continue;
        }

        try {
          const entry = await markdownProcessor.processContent(file.name, fileContent);
          store.set(entry);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Error processing file ${file.name}: ${message}`);
          // Continue with other files even if one fails
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error in moveReferenceLoader: ${message}`);
      throw error;
    }
  }

  return {
    name: "move-reference",
    load: (context) => loadContent(context),
  };
}
