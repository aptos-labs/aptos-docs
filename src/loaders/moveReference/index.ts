import type { Loader, LoaderContext } from "astro/loaders";
import { blue, dim, bold, yellow, red, green } from "kleur/colors";
import { ENABLE_MOVE_REFERENCE, GITHUB_TOKEN } from "astro:env/server";
import { octokit } from "../../lib/octokit.js";
import type { GitHubConfig, ProcessingStats } from "./types";
import { GitHubFetcher } from "./services/github-fetcher";
import { MarkdownProcessor } from "./services/markdown-processor";
import { getPluginHash } from "./utils/plugin-hash.js";

export function moveReferenceLoader(config: GitHubConfig): Loader {
  async function loadContent(context: LoaderContext): Promise<void> {
    const { store, meta, logger } = context;
    const stats: ProcessingStats = {
      totalMdFiles: 0,
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      errorFiles: 0,
      cachedModules: 0,
    };

    // Check if plugins have changed
    const currentHash = await getPluginHash();
    const storedHash = meta.get("plugin-version");

    // Only clear cache if we had a previous hash that's different
    if (storedHash !== undefined && currentHash !== storedHash) {
      logger.info(`${red("▼")} Plugin changes detected, clearing cache...`);

      // Clear all entries from store
      for (const [id] of store.entries()) {
        store.delete(id);
      }

      // Clear all meta data
      const metaKeys = ["plugin-version", "branch-cache"];
      for (const branch of config.branches) {
        for (const module of branch.modules) {
          metaKeys.push(`${branch.name}-${module.framework}-folder-etag`);
          metaKeys.push(`${branch.name}-${module.framework}-file-count`);
        }
      }
      metaKeys.forEach((key) => {
        meta.delete(key);
      });

      logger.info(`${green("▼")} Cache and store cleared, will reload all content`);
    }

    // Always store the current hash
    meta.set("plugin-version", currentHash);

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
            // Get module content
            const contentMap = await githubFetcher.getModuleContent(branch, module);
            stats.totalFiles += contentMap.size;

            // Process each file
            for (const [fileName, content] of contentMap) {
              try {
                // Generate the entry ID in the format: branch/framework/filename
                const baseFilename = fileName.replace(/\.md$/, "");
                const entryId = `${branch.name}/${module.framework}/${baseFilename}`;
                const entry = await markdownProcessor.processContent(entryId, content);

                // Add branch and framework metadata
                Object.assign(entry.data, {
                  network: branch.name,
                  framework: module.framework,
                  title: baseFilename,
                });
                Object.assign(entry, { digest: context.generateDigest(entry.data) });

                try {
                  store.set(entry);
                  stats.processedFiles++;
                } catch (storeError) {
                  const message =
                    storeError instanceof Error ? storeError.message : String(storeError);
                  logger.error(`Error storing entry ${entryId}: ${message}`);
                  stats.errorFiles++;
                }
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error processing file ${fileName}: ${message}`);
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
    load: async (context) => {
      // Don't load Move Reference content in GITHUB CI
      if (process.env.GITHUB_ACTIONS) {
        context.logger.warn(`${context.collection} loader is disabled in GITHUB CI`);
        return;
      }

      // Don't load Move Reference content if the feature is disabled
      if (ENABLE_MOVE_REFERENCE === "false") {
        return;
      }

      // Don't load Move Reference content if GITHUB_TOKEN is not set
      if (ENABLE_MOVE_REFERENCE === "true" && GITHUB_TOKEN === undefined) {
        context.logger.error("GITHUB_TOKEN is required to load Move Reference content");
        return;
      }

      return loadContent(context);
    },
  };
}
