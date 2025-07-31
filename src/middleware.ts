import { defineMiddleware } from "astro:middleware";
import redirectMiddleware from "./middlewares/redirects.js";

export const onRequest = defineMiddleware(async (context, next) => {
  // Try to handle redirect
  const redirectResponse = redirectMiddleware(context.request);

  if (redirectResponse) {
    return redirectResponse;
  }

  // Continue to the next middleware or route handler
  return next();
});
