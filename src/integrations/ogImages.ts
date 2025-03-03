import type { AstroIntegration } from "astro";
import { loadEnv } from "vite";

export function ogImagesIntegration(): AstroIntegration {
  return {
    name: "astro-og-images",
    hooks: {
      "astro:config:done": ({ logger }) => {
        const env = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
        if (!env.OG_IMAGES_SECRET) {
          logger.warn(
            "OG_IMAGES_SECRET is not set. OG image generation is disabled for this build (enabled in production).",
          );
        }
      },
    },
  };
}
