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

// GitHub repository and branch configuration
// Can be overridden via environment variables for forks/staging deployments
const GITHUB_REPO = process.env.GITHUB_REPO ?? "aptos-labs/aptos-docs";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const DOCS_PATH_PREFIX = "/src/content/docs";

/**
 * Normalize a path and check for path traversal attempts
 * Returns null if the path is invalid or attempts traversal
 */
function normalizePath(pathname: string): string | null {
  // Reject paths with encoded traversal sequences
  if (pathname.includes("%2e") || pathname.includes("%2E")) {
    return null;
  }

  // Split path into segments and resolve . and ..
  const segments = pathname.split("/").filter(Boolean);
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment === "..") {
      // Path traversal attempt - reject entirely rather than just popping
      return null;
    } else if (segment !== ".") {
      resolved.push(segment);
    }
  }

  return "/" + resolved.join("/");
}

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

  // Normalize the path and check for traversal attempts
  const normalizedPath = normalizePath(basePath);
  if (normalizedPath === null) {
    // Path traversal attempt detected - return 400 Bad Request
    return new Response("Invalid path", { status: 400 });
  }

  // Construct the GitHub raw content URL
  // The actual files are .mdx, so we add that extension
  const githubRawUrl = `${GITHUB_RAW_BASE}${DOCS_PATH_PREFIX}${normalizedPath}.mdx`;

  // Return a redirect to GitHub raw content.
  // We explicitly use a 302 (temporary) redirect rather than 301 to:
  // - Avoid clients caching the redirect target, since the GitHub URL may change
  //   (for example, when the default branch changes or files are moved/renamed).
  return Response.redirect(githubRawUrl, 302);
}
