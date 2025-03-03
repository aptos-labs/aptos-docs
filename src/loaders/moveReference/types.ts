export interface ModuleConfig {
  framework: string;
  folder: string;
}

export interface BranchConfig {
  name: string;
  ref: string;
  modules: ModuleConfig[];
}

export interface GitHubConfig {
  owner: string;
  repo: string;
  branches: BranchConfig[];
}

export interface GitHubFileContent {
  type: "file";
  name: string;
  path: string;
  content?: string;
  sha?: string;
}

export interface GitHubResponse {
  status: number;
  headers: {
    etag?: string;
  };
  data: GitHubFileContent | GitHubFileContent[];
}

export interface ContentEntry {
  id: string;
  data: {
    network?: string;
    framework?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
  body: string;
  rendered: {
    html: string;
    metadata: Record<string, unknown>;
  };
}

export interface CacheMetadata {
  commitHash: string;
  lastFetch: string;
  moduleEtag: string;
}

export interface ProcessingStats {
  totalMdFiles: number;
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  errorFiles: number;
  cachedModules: number;
  cacheHits: number;
  cacheMisses: number;
  unchangedModules: number;
  updatedModules: number;
}

export interface ModuleStatus {
  framework: string;
  isCached: boolean;
  filesCount: number;
  commitHash?: string;
}

export interface TreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

export interface TreeResponse {
  data: {
    sha: string;
    url: string;
    tree: TreeItem[];
    truncated: boolean;
  };
}

export interface GitHubGraphQLResponse {
  repository: {
    object: {
      entries: {
        name: string;
        type: string;
        object?: {
          text?: string;
        };
      }[];
    } | null;
    ref?: {
      target: {
        oid: string;
        history: {
          nodes: {
            committedDate: string;
          }[];
        };
      };
    };
  };
}
