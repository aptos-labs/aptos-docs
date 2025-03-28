// @ts-check
// Edge-compatible middleware that implements a middleware chain pattern
import i18nRedirect from "./src/middlewares/i18n-redirect.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Auto-generated matcher
import { matcher } from "./src/middlewares/matcher-routes-dynamic.js";

// Create config object with the auto-generated matcher
export const config = {
  matcher,
};

// Function to run middleware sequentially
/**
 *
 * @param {Request} req
 * @param {((req: Request) => (Promise<Response | void> | Response | void))[]} middlewares
 * @returns {Promise<Response | void>}
 */
async function applyMiddleware(req, middlewares) {
  /**
   * @type {Promise<Response | void>}
   */
  const init = Promise.resolve(void 0);

  return middlewares.reduce(async (chain, middleware) => {
    const response = await chain;
    if (response) return response; // Stop chain if middleware returns a response
    return middleware(req);
  }, init);
}

// The main middleware function
/**
 *
 * @param {Request} req
 * @returns
 */
export default async function middleware(req) {
  return await applyMiddleware(req, [
    i18nRedirect,
    // Add more middleware functions here as needed
  ]);
}
