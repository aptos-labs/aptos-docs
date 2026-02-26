import type { AstroIntegration } from "astro";
import { envField } from "astro/config";
import { ENV, IS_VERCEL } from "../lib/env";
import { OG_IMAGES_ENV_NAME } from "../lib/og-image/constants";

export function ogImagesIntegration(): AstroIntegration {
  return {
    name: "astro-og-images",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          env: {
            schema: {
              [OG_IMAGES_ENV_NAME]: envField.string({
                context: "server",
                access: "secret",
                optional: true,
              }),
            },
          },
        });
      },
      "astro:config:done": ({ logger }) => {
        if (!ENV[OG_IMAGES_ENV_NAME]) {
          if (IS_VERCEL) {
            throw new Error(`${OG_IMAGES_ENV_NAME} must be set in Vercel deployments.`);
          }

          logger.warn(
            `${OG_IMAGES_ENV_NAME} is not set. OG image generation is disabled for this build (enabled in production).`,
          );
        }
      },
    },
  };
}
