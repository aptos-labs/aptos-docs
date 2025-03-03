import type { z } from "astro:schema";
import { jwtVerify } from "jose";
import { getOgImageSecret } from "./getOgImageSecret";
import { invariant } from "~/lib/invariant";
import { OGImageError } from "~/lib/og-image/errors";

export async function parseTokenOptions<Schema extends z.AnyZodObject>(
  signedJWTToken: string | null,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const secret = getOgImageSecret();

  invariant(signedJWTToken, new OGImageError("Token isn't specified"));
  invariant(secret, new OGImageError("Secret isn't specified"));

  const verifiedJWT = await jwtVerify(signedJWTToken, secret);
  return schema.parse(verifiedJWT.payload);
}
