// Edge-compatible middleware that implements a middleware chain pattern
import i18nRedirect from "./src/middlewares/i18n-redirect.js";
import { matcher } from "./src/middlewares/matcher-routes-dynamic.js";

// Create config object with the auto-generated matcher
export const config = {
  matcher,
};

// Function to run middleware sequentially
async function applyMiddleware(req, middlewares) {
  return middlewares.reduce(async (chain, middleware) => {
    const response = await chain;
    if (response) return response; // Stop chain if middleware returns a response
    return middleware(req);
  }, Promise.resolve(null));
}

// The main middleware function
export default async function middleware(req) {
  return await applyMiddleware(req, [
    i18nRedirect,
    // Add more middleware functions here as needed
  ]);
}
