import type { LoaderContext } from "astro/loaders";
import { blue, dim, red } from "kleur/colors";
import { graphql } from "@octokit/graphql";
import { GITHUB_TOKEN } from "astro:env/server";
import type { GitHubConfig, BranchConfig, ModuleConfig } from "../types.js";

interface GetFilesResponse {
  repository: {
    object: {
      entries: {
        name: string;
        type: string;
        path: string;
        object?: {
          text?: string;
        };
      }[];
    };
  };
}

interface GetCommitResponse {
  repository: {
    object: {
      history: {
        nodes: {
          committedDate: string;
        }[];
      };
    };
  };
}

const GET_FILES_QUERY = `
  query getFiles($owner: String!, $repo: String!, $expression: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Tree {
          entries {
            name
            type
            path
            object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;

const GET_COMMIT_QUERY = `
  query getCommit($owner: String!, $repo: String!, $ref: String!, $path: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $ref) {
        ... on Commit {
          history(first: 1, path: $path) {
            nodes {
              committedDate
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

  async getModuleContent(
    branch: BranchConfig,
    module: ModuleConfig,
  ): Promise<Map<string, { content: string; lastUpdated: string }>> {
    try {
      this.context.logger.info(
        this.formatTreeLog(branch.name, module.framework, `Fetching docs from ${module.folder}`),
      );

      const data = await this.client<GetFilesResponse>(GET_FILES_QUERY, {
        owner: this.config.owner,
        repo: this.config.repo,
        expression: `${branch.ref}:${module.folder}`,
      });

      const entries = data.repository.object.entries;
      const contentMap = new Map<string, { content: string; lastUpdated: string }>();

      for (const entry of entries) {
        if (entry.type === "blob" && entry.name.endsWith(".md") && entry.object?.text) {
          // Get commit date for this specific file
          const commitData = await this.client<GetCommitResponse>(GET_COMMIT_QUERY, {
            owner: this.config.owner,
            repo: this.config.repo,
            ref: branch.ref,
            path: `${module.folder}/${entry.name}`,
          });

          const lastUpdated =
            commitData.repository.object.history.nodes[0]?.committedDate ??
            new Date().toISOString();

          contentMap.set(entry.name, {
            content: entry.object.text,
            lastUpdated,
          });
        }
      }

      if (contentMap.size === 0) {
        this.context.logger.error(red(`No markdown files found in ${branch.ref}:${module.folder}`));
      }

      return contentMap;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.context.logger.error(
        this.formatTreeLog(branch.name, module.framework, red(`✗ (${message})`)),
      );
      return new Map<string, { content: string; lastUpdated: string }>();
    }
  }
}
