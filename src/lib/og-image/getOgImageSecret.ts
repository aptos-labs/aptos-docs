import * as astroEnv from "astro:env/server";
import { ENV_NAME } from "./constants.mjs";

export function getOgImageSecret(): Uint8Array | null {
  // We don't use `getSecret` here, because it doesn't return default value if the secret isn't specified
  const secret = astroEnv[ENV_NAME];
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}
