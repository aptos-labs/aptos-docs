import type { z } from "astro/zod";
import { jwtVerify } from "jose";
import { invariant } from "~/lib/invariant";
import { OGImageError } from "~/lib/og-image/errors";
import { getOgImageSecret } from "./getOgImageSecret";

export async function parseTokenOptions<Schema extends z.ZodObject>(
  signedJWTToken: string | null,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const secret = getOgImageSecret();

  invariant(signedJWTToken, "Token isn't specified", OGImageError);
  invariant(secret, "Secret isn't specified", OGImageError);

  const verifiedJWT = await jwtVerify(signedJWTToken, secret);
  return schema.parse(verifiedJWT.payload);
}
