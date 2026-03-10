import type { AstroIntegration, RouteOptions } from "astro";

/**
 * Overrides the starlight-llms-txt plugin's /llms.txt index route with a structured
 * version that lists all pages with titles, descriptions, and per-page .md URLs.
 *
 * Uses the astro:route:setup hook to swap the plugin's entrypoint for our custom handler
 * while keeping the llms-full.txt and llms-small.txt routes from the plugin untouched.
 */
export function llmsTxtIndex(): AstroIntegration {
  return {
    name: "llms-txt-index",
    hooks: {
      "astro:route:setup": ({ route }: { route: RouteOptions }) => {
        // Only override the plugin's /llms.txt index route (not full/small/custom)
        if (
          route.component.includes("starlight-llms-txt") &&
          route.component.endsWith("/llms.txt.ts")
        ) {
          (route as { component: string }).component = "./src/pages/llms-index.ts";
        }
      },
    },
  };
}
