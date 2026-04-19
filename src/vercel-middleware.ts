import { next } from "@vercel/edge";
import enRedirect from "./middlewares/en-redirect";
// Edge-compatible middleware that implements a middleware chain pattern
import i18nRedirect from "./middlewares/i18n-redirect";
import markdownNegotiation from "./middlewares/markdown-negotiation";
import { matcher } from "./middlewares/matcher-routes-dynamic";

// Create config object with the auto-generated matcher
export const config = {
  matcher,
};

// Function to run middleware sequentially
async function applyMiddleware(
  req: Request,
  middlewares: ((req: Request) => Promise<Response | undefined> | Response | undefined)[],
) {
  return middlewares.reduce<Promise<Response | undefined>>(
    async (chain, middleware) => {
      const response = await chain;
      if (response) return response; // Stop chain if middleware returns a response
      return middleware(req);
    },
    Promise.resolve(void 0),
  );
}

// The main middleware function
export default async function middleware(req: Request) {
  return await applyMiddleware(req, [
    // Canonicalize `/en/...` URLs first. The Markdown export routes are
    // generated from doc ids (no `en/` prefix), so rewriting `/en/foo` to
    // `/en/foo.md` would 404 — we need the redirect to strip `/en` before
    // markdown negotiation runs.
    enRedirect,
    // Agents requesting text/markdown are served the rendered .md export.
    markdownNegotiation,
    i18nRedirect,
    // Add more middleware functions here as needed
    next,
  ]);
}
