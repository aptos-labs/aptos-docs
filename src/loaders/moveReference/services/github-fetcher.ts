import type { LoaderContext } from "astro/loaders";
import { octokit } from "../../../lib/octokit.js";
import type { GitHubConfig, GitHubResponse, GitHubFileContent } from "../types.js";

export class GitHubFetcher {
  constructor(
    private config: GitHubConfig,
    private context: LoaderContext,
  ) {}

  async getFolderContent(retryCount = 0): Promise<GitHubFileContent[]> {
    const { store, logger, meta } = this.context;
    const hasContent = store.entries().length > 0;

    // Prevent infinite recursion
    if (retryCount > 1) {
      throw new Error("Too many retry attempts");
    }

    try {
      // Check if there's an ETag already stored
      const folderEtag = meta.get("folder-etag");
      const headers = folderEtag ? { "if-none-match": folderEtag } : {};

      // Fetch folder content from GitHub
      const folderResponse = (await octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: this.config.ref,
        path: this.config.folder,
        headers,
      })) as GitHubResponse;

      // Skip processing if content hasn't changed and we have existing entries
      if (hasContent && folderResponse.status === 304) {
        logger.info("Content not modified, using existing content");
        return [];
      }

      // Store the new ETag for future requests
      const { etag } = folderResponse.headers;
      if (etag) {
        meta.set("folder-etag", etag);
      }

      // Validate response data
      if (!Array.isArray(folderResponse.data)) {
        logger.warn(`No content found at ${this.config.folder}`);
        return [];
      }

      return folderResponse.data;
    } catch (error) {
      // Handle GitHub API errors
      if (error instanceof Error) {
        // If we get a 304 and have content, use the cached content
        if (error.message === "Not modified" && hasContent) {
          logger.info("Content not modified, using existing content");
          return [];
        }

        // If we get a 304 but have no content, retry with cleared ETag
        if (error.message === "Not modified" && !hasContent) {
          logger.info("Got 304 but store is empty, clearing ETag to force refresh");
          meta.delete("folder-etag");
          return this.getFolderContent(retryCount + 1);
        }

        // For other errors, log and rethrow
        logger.error(`Error fetching folder content: ${error.message}`);
        throw error;
      }

      // For non-Error objects, convert to string
      const message = String(error);
      logger.error(`Error fetching folder content: ${message}`);
      throw new Error(message);
    }
  }

  async getFileContent(fileName: string): Promise<string | null> {
    try {
      const fileResponse = (await octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: `${this.config.folder}/${fileName}`,
      })) as GitHubResponse;

      const fileData = fileResponse.data as GitHubFileContent;
      if (!fileData.content) {
        return null;
      }

      return Buffer.from(fileData.content, "base64").toString("utf-8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.context.logger.error(`Error fetching file content for ${fileName}: ${message}`);
      return null;
    }
  }
}
