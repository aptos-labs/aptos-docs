import { next } from "@vercel/edge";

/* eslint-disable @typescript-eslint/no-invalid-void-type */
// Edge-compatible middleware that implements a middleware chain pattern
import i18nRedirect from "./middlewares/i18n-redirect";
import enRedirect from "./middlewares/en-redirect";
import redirectMiddleware from "./middlewares/redirects";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - auto-generated import
import { matcher } from "./middlewares/matcher-routes-dynamic";

// Create config object with the auto-generated matcher
export const config = {
  // eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment
  matcher,
};

// Function to run middleware sequentially
async function applyMiddleware(
  req: Request,
  middlewares: ((req: Request) => Promise<Response | void> | Response | void | undefined)[],
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
    redirectMiddleware, // Handle specific page redirects first
    enRedirect,
    i18nRedirect,
    // Add more middleware functions here as needed
    next,
  ]);
}
