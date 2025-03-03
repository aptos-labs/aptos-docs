import type { Loader, LoaderContext } from "astro/loaders";
import { blue, dim, bold, yellow, red, green } from "kleur/colors";
import { ENABLE_MOVE_REFERENCE, GITHUB_TOKEN } from "astro:env/server";
import { octokit } from "../../lib/octokit.js";
import type { GitHubConfig, ProcessingStats } from "./types";
import { GitHubFetcher } from "./services/github-fetcher";
import { MarkdownProcessor } from "./services/markdown-processor";
import { getPluginHash } from "./utils/plugin-hash.js";
import { IS_GITHUB_CI } from "~/lib/ci.mjs";

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
      cacheHits: 0,
      cacheMisses: 0,
      unchangedModules: 0,
      updatedModules: 0,
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
            // Get module content and metadata
            const { contentMap, commitHash, filesCount } = await githubFetcher.getModuleContent(
              branch,
              module,
            );

            // Update stats based on cache status
            if (contentMap.size === 0 && commitHash) {
              // Count each file in the cached module
              stats.cacheHits += filesCount;
              stats.unchangedModules += filesCount; // Count each file as an unchanged module
              stats.cachedModules++;
              stats.totalFiles += filesCount;

              // For cached entries, ensure Starlight properties are set
              const prefix = `${branch.ref.toLowerCase()}/${module.framework.toLowerCase()}/`;
              for (const [id, entry] of store.entries()) {
                if (id.startsWith(prefix)) {
                  const pathParts = id.split("/");
                  const baseFilename = pathParts[pathParts.length - 1] ?? "";
                  const fileName = `${baseFilename}.md`;

                  // Create a new entry with updated data
                  const updatedEntry = {
                    ...entry,
                    data: {
                      ...entry.data,
                      hidden: false,
                      sidebar: {
                        label: baseFilename,
                        order: fileName === "overview.md" ? -1 : 0,
                      },
                    },
                  };
                  store.set(updatedEntry);
                }
              }
              continue;
            } else if (contentMap.size > 0) {
              stats.cacheMisses += contentMap.size;
              stats.updatedModules += contentMap.size; // Count each file as an updated module
              stats.totalFiles += filesCount;
            }

            // Process each file if we have new content
            for (const [fileName, fileData] of contentMap.entries()) {
              try {
                // Generate the entry ID to match the URL path: /move-reference/[network]/[framework]/[filename]
                const baseFilename = fileName.replace(/\.md$/, "").toLowerCase();
                const entryId = `${branch.ref.toLowerCase()}/${module.framework.toLowerCase()}/${baseFilename}`;
                const fullPath = `${branch.name}/${module.framework}/${fileName}`;
                const { content, lastUpdated } = fileData;
                const entry = await markdownProcessor.processContent(fullPath, content);

                // Add branch and framework metadata
                Object.assign(entry, { id: entryId });
                Object.assign(entry.data, {
                  network: branch.ref.toLowerCase(), // Use ref for network to match URL structure
                  framework: module.framework.toLowerCase(),
                  title: baseFilename,
                  editUrl: `https://github.com/${config.owner}/${config.repo}/edit/${branch.ref}/${module.folder}/${fileName}`,
                  description:
                    fileName === "overview.md"
                      ? (() => {
                          // Split by double newlines
                          const paragraphs = content.split("\n\n");
                          // Find the paragraph after the title (skip anchor and title)
                          const description =
                            paragraphs[2]?.trim() ??
                            `Documentation for ${module.framework} modules`;
                          return description;
                        })()
                      : undefined,
                  lastUpdated,
                  // Required Starlight frontmatter properties
                  hidden: false,
                  sidebar: {
                    label: baseFilename,
                    order: fileName === "overview.md" ? -1 : 0,
                  },
                });
                Object.assign(entry, { digest: context.generateDigest(entry.data) });

                // Store all entries including overview.md so we can access its description
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
      logger.info(`${blue("├─")} ${dim("Cache hits:")} ${String(stats.cacheHits)}`);
      logger.info(`${blue("├─")} ${dim("Cache misses:")} ${String(stats.cacheMisses)}`);
      logger.info(`${blue("├─")} ${dim("Unchanged modules:")} ${String(stats.unchangedModules)}`);
      logger.info(`${blue("├─")} ${dim("Updated modules:")} ${String(stats.updatedModules)}`);
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
      if (IS_GITHUB_CI) {
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
