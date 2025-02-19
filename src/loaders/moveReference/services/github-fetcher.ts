import type { LoaderContext } from "astro/loaders";
import { blue, dim, green } from "kleur/colors";
import { octokit } from "../../../lib/octokit.js";
import type {
  GitHubConfig,
  GitHubResponse,
  GitHubFileContent,
  BranchConfig,
  ModuleConfig,
} from "../types.js";

export class GitHubFetcher {
  private cachedFileCounts: Map<string, number>;

  constructor(
    private config: GitHubConfig,
    private context: LoaderContext,
  ) {
    this.cachedFileCounts = new Map();
  }

  private getMetaKey(
    branch: string,
    framework: string,
    type: "folder-etag" | "file-count",
  ): string {
    return `${branch}-${framework}-${type}`;
  }

  private getModuleKey(branch: string, framework: string): string {
    return `${branch}/${framework}`;
  }

  private formatTreeLog(branch: string, framework: string, message: string): string {
    return `${blue("├─")} ${dim(`${branch}/${framework}`)} ${message}`;
  }

  async getFolderContent(
    branch: BranchConfig,
    module: ModuleConfig,
    retryCount = 0,
  ): Promise<GitHubFileContent[]> {
    const { store, logger, meta } = this.context;
    const metaKey = this.getMetaKey(branch.name, module.framework, "folder-etag");
    const fileCountKey = this.getMetaKey(branch.name, module.framework, "file-count");
    const moduleKey = this.getModuleKey(branch.name, module.framework);
    const storePrefix = `${branch.name}/${module.framework}/`;
    const hasContent = store.entries().some(([id]) => id.startsWith(storePrefix));

    // Prevent infinite recursion
    if (retryCount > 1) {
      throw new Error("Too many retry attempts");
    }

    try {
      // Check if there's an ETag already stored
      const folderEtag = meta.get(metaKey);
      const headers = folderEtag ? { "if-none-match": folderEtag } : {};

      // Fetch folder content from GitHub
      const folderResponse = (await octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: branch.ref,
        path: module.folder,
        headers,
      })) as GitHubResponse;

      // If we have content and get a 304, use the cached content
      if (hasContent && folderResponse.status === 304) {
        // Get the cached file count
        const cachedCount = Number(meta.get(fileCountKey) ?? "0");
        this.cachedFileCounts.set(moduleKey, cachedCount);
        logger.info(this.formatTreeLog(branch.name, module.framework, green("✓ (cached)")));
        return [];
      }

      // Store the new ETag for future requests
      const { etag } = folderResponse.headers;
      if (etag) {
        meta.set(metaKey, etag);
      }

      // Validate response data
      if (!Array.isArray(folderResponse.data)) {
        logger.warn(this.formatTreeLog(branch.name, module.framework, "⚠ (no content)"));
        return [];
      }

      // Store the file count for future reference
      const mdFiles = folderResponse.data.filter((file) => file.name.endsWith(".md"));
      const fileCount = mdFiles.length;
      meta.set(fileCountKey, String(fileCount));
      this.cachedFileCounts.set(moduleKey, fileCount);

      logger.info(
        this.formatTreeLog(branch.name, module.framework, `✓ (${String(fileCount)} files)`),
      );
      return mdFiles;
    } catch (error) {
      // Handle GitHub API errors
      if (error instanceof Error) {
        // If we get a 304 and have content, use the cached content
        if (error.message === "Not modified" && hasContent) {
          // Get the cached file count
          const cachedCount = Number(meta.get(fileCountKey) ?? "0");
          this.cachedFileCounts.set(moduleKey, cachedCount);
          logger.info(this.formatTreeLog(branch.name, module.framework, green("✓ (cached)")));
          return [];
        }

        // If we get a 304 but have no content, we need to force a refresh
        if (error.message === "Not modified" && !hasContent) {
          // Only clear the ETag if we don't have content
          meta.delete(metaKey);
          logger.info(this.formatTreeLog(branch.name, module.framework, "⟳ (refreshing)"));
          return this.getFolderContent(branch, module, retryCount + 1);
        }

        // For other errors, log and rethrow
        logger.error(this.formatTreeLog(branch.name, module.framework, `✗ (${error.message})`));
        throw error;
      }

      // For non-Error objects, convert to string
      const message = String(error);
      logger.error(this.formatTreeLog(branch.name, module.framework, `✗ (${message})`));
      throw new Error(message);
    }
  }

  getCachedFileCount(branch: string, framework: string): number {
    return this.cachedFileCounts.get(this.getModuleKey(branch, framework)) ?? 0;
  }

  async getFileContent(
    branch: BranchConfig,
    module: ModuleConfig,
    fileName: string,
  ): Promise<string | null> {
    try {
      const fileResponse = (await octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: branch.ref,
        path: `${module.folder}/${fileName}`,
      })) as GitHubResponse;

      const fileData = fileResponse.data as GitHubFileContent;
      if (!fileData.content) {
        return null;
      }

      return Buffer.from(fileData.content, "base64").toString("utf-8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.context.logger.error(
        this.formatTreeLog(branch.name, module.framework, `✗ (${message})`),
      );
      return null;
    }
  }
}
