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
    // Markdown negotiation runs *before* i18nRedirect on purpose. Agents that
    // ask for `Accept: text/markdown` get the path-as-requested rather than a
    // 302 to the locale variant inferred from cookies/Accept-Language: agents
    // typically don't carry a preferred-locale cookie, the WebMCP
    // `fetch-doc-markdown` tool fetches from the *current* page's URL, and
    // pinning markdown to the requested path makes it deterministic for
    // ingestion (LLMs.txt feeds, agent grounding). Browsers hitting the page
    // without an explicit Accept header still flow through i18nRedirect below.
    markdownNegotiation,
    i18nRedirect,
    // Add more middleware functions here as needed
    next,
  ]);
}
