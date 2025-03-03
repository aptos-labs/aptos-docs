import { getSecret } from "astro:env/server";
import { OG_IMAGES_ENV_NAME } from "./constants";

export function getOgImageSecret(): Uint8Array | null {
  const secret = getSecret(OG_IMAGES_ENV_NAME);
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}
