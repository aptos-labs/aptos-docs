import type { AstroIntegration, RouteOptions } from "astro";

// Helper function to determine if we should generate static paths
export const shouldGenerateStaticPaths = () => {
  return Boolean(process.env.GITHUB_TOKEN) && !process.env.VERCEL_ENV;
};

// The integration
export function setPrerender(): AstroIntegration {
  return {
    name: "set-prerender",
    hooks: {
      "astro:route:setup": ({ route }: { route: RouteOptions }) => {
        if (
          route.component.includes("/move-reference/") &&
          !route.component.endsWith("/move-reference.astro")
        ) {
          route.prerender = shouldGenerateStaticPaths();
        }
      },
    },
  };
}
