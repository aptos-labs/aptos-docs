import { GITHUB_TOKEN } from "astro:env/server";
import { Octokit } from "octokit";

export const octokit = new Octokit({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Astro's virtual modules (astro:env/server) have limited TypeScript support
  auth: GITHUB_TOKEN,
});
