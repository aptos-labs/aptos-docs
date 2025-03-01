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

export interface ProcessingStats {
  totalMdFiles: number; // Total .md files across all branches/modules
  totalFiles: number; // Files processed this run
  processedFiles: number; // Successfully processed
  skippedFiles: number; // No content
  errorFiles: number; // Processing errors
  cachedModules: number; // Modules using cached content
}

export interface ModuleStatus {
  framework: string;
  isCached: boolean;
  filesCount: number;
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
