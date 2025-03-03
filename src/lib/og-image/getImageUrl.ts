import { SignJWT } from "jose";
import { getOgImageSecret } from "./getOgImageSecret";

export async function getImageUrl(
  endpointUrl: URL,
  options: Record<string, unknown>,
): Promise<string | null> {
  const secret = getOgImageSecret();
  if (!secret) {
    return null;
  }

  const signedJWTToken = await new SignJWT(options)
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);
  const finalUrl = new URL(endpointUrl);

  finalUrl.searchParams.set("token", signedJWTToken);

  return finalUrl.toString();
}
