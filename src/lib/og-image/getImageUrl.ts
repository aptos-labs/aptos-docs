import { SignJWT } from "jose";
import { getOgImageSecret } from "./getOgImageSecret";

/**
 * Cache for memoizing OG image URLs during build time.
 * Key: JSON stringified options, Value: generated URL
 * This avoids regenerating JWT tokens for the same content across builds.
 */
const ogImageUrlCache = new Map<string, string>();

export async function getImageUrl(
  endpointUrl: URL,
  options: Record<string, unknown>,
): Promise<string | null> {
  const secret = getOgImageSecret();
  if (!secret) {
    return null;
  }

  // Create a cache key from the endpoint and options
  const cacheKey = JSON.stringify({ endpoint: endpointUrl.pathname, ...options });

  // Return cached URL if available
  const cachedUrl = ogImageUrlCache.get(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const signedJWTToken = await new SignJWT(options)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  const finalUrl = new URL(endpointUrl);

  finalUrl.searchParams.set("token", signedJWTToken);

  const result = finalUrl.toString();

  // Cache the result for future calls with the same options
  ogImageUrlCache.set(cacheKey, result);

  return result;
}
