export interface GitHubConfig {
  owner: string;
  repo: string;
  ref: string;
  folder: string;
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
