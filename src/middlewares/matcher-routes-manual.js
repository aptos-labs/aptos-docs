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

  // Note: .md files are now served as static files generated at build time
  // (see markdownFilesIntegration), no middleware routes needed
];
