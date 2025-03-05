import type { AstroIntegration } from "astro";
import { envField } from "astro/config";
import { ENV, IS_VERCEL } from "../lib/env";
import {
  API_KEY_ENV,
  APP_ID_ENV,
  AUTH_DOMAIN_ENV,
  PROJECT_ID_ENV,
} from "../lib/firebase/constants";

const FIREBASE_ENVS = [API_KEY_ENV, AUTH_DOMAIN_ENV, PROJECT_ID_ENV, APP_ID_ENV];

export function firebaseIntegration(): AstroIntegration {
  return {
    name: "astro-firebase",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          env: {
            schema: FIREBASE_ENVS.reduce<Record<string, ReturnType<typeof envField.string>>>(
              (acc, env) => {
                acc[env] = envField.string({
                  context: "client",
                  access: "public",
                  optional: true,
                });
                return acc;
              },
              {},
            ),
          },
        });
      },
      "astro:config:done": ({ logger }) => {
        FIREBASE_ENVS.forEach((env) => {
          if (!ENV[env]) {
            if (IS_VERCEL) {
              throw new Error(`${env} must be set in the environment.`);
            }

            logger.warn(
              `${env} is not set. Firebase integrations is disabled for this build (enabled in production).`,
            );
          }
        });
      },
    },
  };
}
