/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument -- Astro's virtual modules (astro:env/server) have limited TypeScript support */
import { getSecret } from "astro:env/server";
import { OG_IMAGES_ENV_NAME } from "./constants";

export function getOgImageSecret(): Uint8Array | null {
  const secret = getSecret(OG_IMAGES_ENV_NAME);
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}
