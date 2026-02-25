import { GITHUB_TOKEN } from "astro:env/server";
import { graphql } from "@octokit/graphql";
import type { LoaderContext } from "astro/loaders";
import { blue, dim, red } from "kleur/colors";
import type { BranchConfig, GitHubConfig, GitHubGraphQLResponse, ModuleConfig } from "../types.js";

const GET_MODULE_CONTENT = `
  query getModuleContent($owner: String!, $repo: String!, $expression: String!, $ref: String!, $path: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Tree {
          entries {
            name
            type
            object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
      ref(qualifiedName: $ref) {
        target {
          ... on Commit {
            oid
            history(first: 1, path: $path) {
              nodes {
                committedDate
              }
            }
          }
        }
      }
    }
  }
`;

export class GitHubFetcher {
  private client: ReturnType<typeof graphql.defaults>;

  constructor(
    private config: GitHubConfig,
    private context: LoaderContext,
  ) {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is required to use the GitHub GraphQL API.");
    }

    this.client = graphql.defaults({
      headers: {
        authorization: `token ${GITHUB_TOKEN}`,
      },
    });
  }

  private formatTreeLog(branch: string, framework: string, message: string): string {
    return `${blue("├─")} ${dim(`${branch}/${framework}`)} ${message}`;
  }

  private isValidModuleResponse(response: unknown): response is GitHubGraphQLResponse {
    try {
      return (
        typeof response === "object" &&
        response !== null &&
        "repository" in response &&
        typeof (response as GitHubGraphQLResponse).repository === "object"
      );
    } catch {
      return false;
    }
  }

  async getModuleContent(
    branch: BranchConfig,
    module: ModuleConfig,
  ): Promise<{
    contentMap: Map<string, { content: string; lastUpdated: string }>;
    commitHash: string;
    filesCount: number;
  }> {
    try {
      const cacheKey = `${branch.name}-${module.framework}-commit`;
      const cachedHash = this.context.meta.get(cacheKey);

      // Fetch module content and commit information in a single query
      const moduleData = await this.client<GitHubGraphQLResponse>(GET_MODULE_CONTENT, {
        owner: this.config.owner,
        repo: this.config.repo,
        expression: `${branch.ref}:${module.folder}`,
        ref: branch.ref,
        path: module.folder,
      });

      if (
        !this.isValidModuleResponse(moduleData) ||
        !moduleData.repository.ref?.target ||
        !moduleData.repository.object
      ) {
        throw new Error(`Could not find module content for ${module.folder}`);
      }

      const tree = moduleData.repository.object;
      const target = moduleData.repository.ref.target;
      const currentHash = target.oid;
      const entries = tree.entries;
      const filesCount = entries.length;
      const shortHash = currentHash.substring(0, 7);

      // If commit hash matches cached version, we can skip fetching content
      if (cachedHash === currentHash) {
        this.context.logger.info(
          this.formatTreeLog(branch.name, module.framework, `Using cached content (${shortHash})`),
        );
        return {
          contentMap: new Map(),
          commitHash: currentHash,
          filesCount,
        };
      }

      this.context.logger.info(
        this.formatTreeLog(
          branch.name,
          module.framework,
          `Fetching docs from ${module.folder} (${shortHash})`,
        ),
      );

      const contentMap = new Map<string, { content: string; lastUpdated: string }>();
      const lastCommitDate = target.history.nodes[0]?.committedDate ?? new Date().toISOString();

      // Process all markdown files
      for (const entry of entries) {
        if (entry.type === "blob" && entry.name.endsWith(".md") && entry.object?.text) {
          contentMap.set(entry.name, {
            content: entry.object.text,
            lastUpdated: lastCommitDate,
          });
        }
      }

      if (contentMap.size === 0) {
        this.context.logger.error(red(`No markdown files found in ${branch.ref}:${module.folder}`));
      }

      // Store the new commit hash
      this.context.meta.set(cacheKey, currentHash);

      return {
        contentMap,
        commitHash: currentHash,
        filesCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.context.logger.error(
        this.formatTreeLog(branch.name, module.framework, red(`✗ (${message})`)),
      );
      return {
        contentMap: new Map(),
        commitHash: "",
        filesCount: 0,
      };
    }
  }
}
