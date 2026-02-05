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

  invariant(signedJWTToken, "Token isn't specified", OGImageError);
  invariant(secret, "Secret isn't specified", OGImageError);

  const verifiedJWT = await jwtVerify(signedJWTToken, secret);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- Astro's virtual modules (astro:schema) have limited TypeScript support
  return schema.parse(verifiedJWT.payload) as z.infer<Schema>;
}
