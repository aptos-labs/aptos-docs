import { SignJWT } from "jose";
import { getOgImageSecret } from "./getOgImageSecret";

/**
 * Cache for memoizing OG image URLs during build time.
 * Key: deterministically serialized options, Value: generated URL
 * This avoids regenerating JWT tokens for the same content across builds.
 * The cache is bounded to avoid unbounded memory growth during large builds.
 */
const MAX_CACHE_SIZE = 500;
const ogImageUrlCache = new Map<string, string>();

/**
 * Creates a deterministic cache key by sorting object keys before stringifying.
 * This ensures consistent cache keys regardless of property insertion order.
 */
function createDeterministicKey(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function setCacheWithLimit(key: string, value: string): void {
  // Evict oldest entry if cache is at capacity (simple FIFO eviction)
  if (ogImageUrlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = ogImageUrlCache.keys().next().value;
    if (firstKey !== undefined) {
      ogImageUrlCache.delete(firstKey);
    }
  }
  ogImageUrlCache.set(key, value);
}

export async function getImageUrl(
  endpointUrl: URL,
  options: Record<string, unknown>,
): Promise<string | null> {
  const secret = getOgImageSecret();
  if (!secret) {
    return null;
  }

  // Create a deterministic cache key from the full endpoint URL and options
  const cacheKey = createDeterministicKey({ endpoint: endpointUrl.toString(), ...options });

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
  setCacheWithLimit(cacheKey, result);

  return result;
}
