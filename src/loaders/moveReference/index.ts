import type { Loader, LoaderContext } from "astro/loaders";
import { blue, dim, bold, yellow } from "kleur/colors";
import { octokit } from "../../lib/octokit.js";
import type { GitHubConfig, ProcessingStats } from "./types";
import { GitHubFetcher } from "./services/github-fetcher";
import { MarkdownProcessor } from "./services/markdown-processor";

export function moveReferenceLoader(config: GitHubConfig): Loader {
  async function loadContent(context: LoaderContext): Promise<void> {
    const { store, logger } = context;
    const stats: ProcessingStats = {
      totalMdFiles: 0,
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      cachedModules: 0,
    };

    // Initialize services
    const githubFetcher = new GitHubFetcher(config, context);
    const markdownProcessor = await MarkdownProcessor.create(context.config);

    try {
      // Process each branch
      for (const branch of config.branches) {
        logger.info(`${blue("▼")} Processing ${bold(branch.name)}`);

        // Process each module in the branch
        for (const module of branch.modules) {
          try {
            // Get folder content from GitHub
            const files = await githubFetcher.getFolderContent(branch, module);

            // Track fresh vs cached content
            if (files.length > 0) {
              stats.totalFiles += files.length;
            } else {
              stats.cachedModules++;
            }

            // Process each file in the folder
            for (const file of files) {
              const fileContent = await githubFetcher.getFileContent(branch, module, file.name);

              if (!fileContent) {
                stats.skippedFiles++;
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

                try {
                  store.set(entry);
                  stats.processedFiles++;
                } catch (storeError) {
                  const message =
                    storeError instanceof Error ? storeError.message : String(storeError);
                  logger.error(`Error storing entry ${entryId}: ${message}`);
                  stats.errorFiles++;
                  continue;
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error processing file ${file.name}: ${message}`);
                stats.errorFiles++;
              }
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Error processing module ${module.framework}: ${message}`);
          }
        }
      }

      // If we have no entries at all after processing, something went wrong
      if (store.entries().length === 0) {
        throw new Error("No entries were loaded and no cached content was found");
      }

      // Count total files from store entries
      stats.totalMdFiles = store.entries().length;

      // Log processing stats
      logger.info(`${blue("▼")} Content processing completed`);
      logger.info(`${blue("├─")} ${dim("Total .md files:")} ${String(stats.totalMdFiles)}`);
      logger.info(`${blue("├─")} ${dim("Files processed:")} ${String(stats.totalFiles)}`);
      logger.info(`${blue("├─")} ${dim("Modules using cache:")} ${String(stats.cachedModules)}`);
      logger.info(
        `${blue("├─")} ${dim("Successfully processed:")} ${String(stats.processedFiles)}`,
      );
      logger.info(`${blue("├─")} ${dim("Skipped (no content):")} ${String(stats.skippedFiles)}`);
      logger.info(`${blue("└─")} ${dim("Errors:")} ${String(stats.errorFiles)}`);

      // Check Github rate limit at the end
      const rateLimit = await octokit.request("GET /rate_limit");
      const { limit, remaining, reset } = rateLimit.data.rate;
      const minutesUntilReset = Math.ceil((reset * 1000 - Date.now()) / 1000 / 60);
      logger.info(
        `GitHub API Rate Limit: ${bold(String(remaining))}/${String(limit)} ${yellow(`(resets in ${String(minutesUntilReset)} minutes)`)}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`${blue("✗")} Error: ${message}`);
      throw error;
    }
  }

  return {
    name: "move-reference",
    load: (context) => loadContent(context),
  };
}
