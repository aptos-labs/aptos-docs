import type { LoaderContext } from "astro/loaders";
import { octokit } from "../../../lib/octokit.js";
import type {
  GitHubConfig,
  GitHubResponse,
  GitHubFileContent,
  BranchConfig,
  ModuleConfig,
} from "../types.js";

export class GitHubFetcher {
  constructor(
    private config: GitHubConfig,
    private context: LoaderContext,
  ) {}

  private getMetaKey(branch: string, framework: string, type: "folder-etag"): string {
    return `${branch}-${framework}-${type}`;
  }

  async getFolderContent(
    branch: BranchConfig,
    module: ModuleConfig,
    retryCount = 0,
  ): Promise<GitHubFileContent[]> {
    const { store, logger, meta } = this.context;
    const metaKey = this.getMetaKey(branch.name, module.framework, "folder-etag");
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
        logger.info(
          `Content not modified for ${branch.name}/${module.framework}, using existing content`,
        );
        return [];
      }

      // Store the new ETag for future requests
      const { etag } = folderResponse.headers;
      if (etag) {
        meta.set(metaKey, etag);
      }

      // Validate response data
      if (!Array.isArray(folderResponse.data)) {
        logger.warn(`No content found at ${module.folder} for ${branch.name}/${module.framework}`);
        return [];
      }

      return folderResponse.data;
    } catch (error) {
      // Handle GitHub API errors
      if (error instanceof Error) {
        // If we get a 304 and have content, use the cached content
        if (error.message === "Not modified" && hasContent) {
          logger.info(
            `Content not modified for ${branch.name}/${module.framework}, using existing content`,
          );
          return [];
        }

        // If we get a 304 but have no content, we need to force a refresh
        if (error.message === "Not modified" && !hasContent) {
          // Only clear the ETag if we don't have content
          meta.delete(metaKey);
          logger.info(
            `No content in store for ${branch.name}/${module.framework}, forcing refresh`,
          );
          return this.getFolderContent(branch, module, retryCount + 1);
        }

        // For other errors, log and rethrow
        logger.error(
          `Error fetching folder content for ${branch.name}/${module.framework}: ${error.message}`,
        );
        throw error;
      }

      // For non-Error objects, convert to string
      const message = String(error);
      logger.error(
        `Error fetching folder content for ${branch.name}/${module.framework}: ${message}`,
      );
      throw new Error(message);
    }
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
        `Error fetching file content for ${branch.name}/${module.framework}/${fileName}: ${message}`,
      );
      return null;
    }
  }
}
