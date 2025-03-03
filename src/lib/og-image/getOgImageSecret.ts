import * as astroEnv from "astro:env/server";
import { OG_IMAGES_ENV_NAME } from "./constants";

export function getOgImageSecret(): Uint8Array | null {
  // We don't use `getSecret` here, because it doesn't return default value if the secret isn't specified
  const secret = astroEnv[OG_IMAGES_ENV_NAME];
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}
