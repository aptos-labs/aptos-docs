import type { AstroIntegration } from "astro";
import { envField } from "astro/config";
import { OG_IMAGES_ENV_NAME } from "../lib/og-image/constants";
import { ENV, IS_GITHUB_CI, IS_PRODUCTION } from "../lib/env";

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
          // Ensure that's it's turned on in production
          if (IS_PRODUCTION && !IS_GITHUB_CI) {
            throw new Error(`${OG_IMAGES_ENV_NAME} must be set.`);
          }

          logger.warn(
            `${OG_IMAGES_ENV_NAME} is not set. OG image generation is disabled for this build (enabled in production).`,
          );
        }
      },
    },
  };
}
