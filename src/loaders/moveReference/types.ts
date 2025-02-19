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
  content: string;
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
  data: Record<string, unknown>;
  body: string;
  rendered: {
    html: string;
    metadata: Record<string, unknown>;
  };
}
