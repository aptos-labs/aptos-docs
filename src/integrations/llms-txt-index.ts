import type { AstroIntegration, RouteOptions } from "astro";

/**
 * Overrides the starlight-llms-txt plugin's generated llms routes with local handlers.
 *
 * Uses the astro:route:setup hook to swap the plugin's entrypoints for local routes that
 * provide a curated llms.txt index plus custom llms-small.txt and llms-full.txt outputs.
 *
 * Upgrade note: this depends on `starlight-llms-txt` injecting routes whose `route.component`
 * path contains `starlight-llms-txt` and ends with `/llms.txt.ts`, `/llms-small.txt.ts`, or
 * `/llms-full.txt.ts`. If the package changes those filenames or stops using that path
 * substring, update the matching logic here. The plugin may also register
 * `/_llms-txt/[slug].txt` for custom sets; that route is not overridden.
 */
export function llmsTxtIndex(): AstroIntegration {
  const overrides = new Map([
    ["/llms.txt.ts", "./src/pages/llms-index.ts"],
    ["/llms-small.txt.ts", "./src/pages/llms-small.txt.ts"],
    ["/llms-full.txt.ts", "./src/pages/llms-full.txt.ts"],
  ]);

  return {
    name: "llms-txt-index",
    hooks: {
      "astro:route:setup": ({ route }: { route: RouteOptions }) => {
        if (!route.component.includes("starlight-llms-txt")) {
          return;
        }

        for (const [suffix, component] of overrides) {
          if (route.component.endsWith(suffix)) {
            (route as { component: string }).component = component;
            route.prerender = true;
            return;
          }
        }
      },
    },
  };
}
