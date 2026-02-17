import { GITHUB_TOKEN } from "astro:env/server";
import { Octokit } from "@octokit/core";

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});
