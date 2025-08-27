/**
 * Middleware to redirect /en/* routes to /* routes
 * For example:
 * - /en/sample-page -> /sample-page
 * - /en -> /
 */

import { defineMiddleware } from "astro/middleware";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export default defineMiddleware((ctx, next) => {
  const url = new URL(ctx.request.url);
  const pathname = url.pathname;

  // Check if the path starts with /en
  const enPathMatch = /^\/en(\/.*|$)/.exec(pathname);

  if (enPathMatch) {
    // Get the rest of the path (or / if it's just /en)
    const restOfPath = enPathMatch[1] ?? "/";

    // Update the pathname
    url.pathname = restOfPath;

    // Return a redirect response
    return Response.redirect(url);
  }

  // If not an /en path, continue to the next middleware
  return next();
});
