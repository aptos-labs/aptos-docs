import { next } from "@vercel/edge";

/* eslint-disable @typescript-eslint/no-invalid-void-type */
// Edge-compatible middleware that implements a middleware chain pattern
import markdownRedirect from "./middlewares/markdown-redirect";
import i18nRedirect from "./middlewares/i18n-redirect";
import enRedirect from "./middlewares/en-redirect";
import { matcher } from "./middlewares/matcher-routes-dynamic";

// Create config object with the auto-generated matcher
export const config = {
  matcher,
};

// Function to run middleware sequentially
async function applyMiddleware(
  req: Request,
  middlewares: ((req: Request) => Promise<Response | void> | Response | void)[],
) {
  return middlewares.reduce<Promise<Response | void>>(
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
    markdownRedirect, // Handle .md requests first (redirects to GitHub raw content)
    enRedirect,
    i18nRedirect,
    // Add more middleware functions here as needed
    next,
  ]);
}
