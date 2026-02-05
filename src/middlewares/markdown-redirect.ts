/**
 * Middleware to redirect .md requests to GitHub raw content
 *
 * This allows users to access raw markdown/MDX content by appending .md to any documentation URL.
 * Example: /build/cli.md -> redirects to GitHub raw content for src/content/docs/build/cli.mdx
 *
 * We use GitHub raw content instead of serving files directly to avoid:
 * - Exceeding Vercel's 5MB serverless function body limit
 * - Bundling all documentation content into the function
 */

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/aptos-labs/aptos-docs/main";
const DOCS_PATH_PREFIX = "/src/content/docs";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export default function middleware(request: Request): Response | void {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if the request is for a .md file
  if (!pathname.endsWith(".md")) {
    return undefined;
  }

  // Remove the .md extension to get the base path
  const basePath = pathname.slice(0, -3);

  // Skip if this looks like a file with a different extension (e.g., README.md in repo root)
  // We only want to handle documentation paths
  if (basePath === "" || basePath === "/") {
    return undefined;
  }

  // Construct the GitHub raw content URL
  // The actual files are .mdx, so we add that extension
  const githubRawUrl = `${GITHUB_RAW_BASE}${DOCS_PATH_PREFIX}${basePath}.mdx`;

  // Return a redirect to GitHub raw content
  return Response.redirect(githubRawUrl, 302);
}
