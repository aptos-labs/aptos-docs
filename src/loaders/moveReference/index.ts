import type { Loader, LoaderContext } from "astro/loaders";
import type { GitHubConfig } from "./types";
import { GitHubFetcher } from "./services/github-fetcher";
import { MarkdownProcessor } from "./services/markdown-processor";

export function moveReferenceLoader(config: GitHubConfig): Loader {
  async function loadContent(context: LoaderContext): Promise<void> {
    const { store, logger } = context;

    // Initialize services
    const githubFetcher = new GitHubFetcher(config, context);
    const markdownProcessor = await MarkdownProcessor.create(context.config);

    try {
      // Process each branch
      for (const branch of config.branches) {
        logger.info(`Processing branch: ${branch.name}`);

        // Process each module in the branch
        for (const module of branch.modules) {
          logger.info(`Pulling content from GitHub: ${module.folder}`);

          try {
            // Get folder content from GitHub
            const files = await githubFetcher.getFolderContent(branch, module);

            // If no files returned, it means we're using cached content
            if (files.length === 0) {
              continue;
            }

            // Process each file in the folder
            for (const file of files) {
              const fileContent = await githubFetcher.getFileContent(branch, module, file.name);

              if (!fileContent) {
                logger.warn(`No content found for file: ${file.name}`);
                continue;
              }

              try {
                // Generate the entry ID in the format: branch/framework/filename
                const entryId = `${branch.name}/${module.framework}/${file.name.replace(/\.md$/, "")}`;
                const entry = await markdownProcessor.processContent(entryId, fileContent);

                // Add branch and framework metadata
                entry.data = {
                  ...entry.data,
                  branch: branch.name,
                  framework: module.framework,
                };

                store.set(entry);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error processing file ${file.name}: ${message}`);
                // Continue with other files even if one fails
              }
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Error processing module ${module.framework}: ${message}`);
            // Continue with other modules even if one fails
          }
        }
      }

      // If we have no entries at all after processing, something went wrong
      if (store.entries().length === 0) {
        throw new Error("No entries were loaded and no cached content was found");
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
