import type { z } from "astro:schema";
import { jwtVerify } from "jose";
import { getOgImageSecret } from "./getOgImageSecret";

export async function parseTokenOptions<Schema extends z.AnyZodObject>(
  signedJWTToken: string | null,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  const secret = getOgImageSecret();
  // If secret is not available, OG image generation is disabled
  if (!secret || !signedJWTToken) {
    return null;
  }

  try {
    const verifiedJWT = await jwtVerify(signedJWTToken, secret);
    return schema.parse(verifiedJWT.payload);
  } catch {
    // Return null for any verification or parsing errors
    return null;
  }
}
