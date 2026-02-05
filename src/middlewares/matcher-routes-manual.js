// Manual routes for middleware configuration
// Add any custom routes here that aren't automatically detected

export const routes = [
  // Examples:
  // '/custom-page/:path*',
  // '/api/:path*',
  // Add your custom routes below

  // Routes for /en/* redirects
  "/en",
  "/en/:path*",

  // Routes for .md file access (redirects to GitHub raw content)
  // These allow accessing raw markdown by appending .md to any doc URL
  "/:path*.md",
];
