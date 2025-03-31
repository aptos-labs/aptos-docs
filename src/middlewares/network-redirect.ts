import { NETWORK_NAMES, DEFAULT_NETWORK, type NetworkName } from "../config/networks";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export default function middleware(request: Request): Response | void {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check for cookie
  const cookies = request.headers.get("cookie") ?? "";
  const networkCookieMatch = /preferred_network=([a-z-]+)/.exec(cookies);
  let preferredNetwork: NetworkName = DEFAULT_NETWORK;

  // Validate that the cookie value is a valid network
  if (networkCookieMatch && NETWORK_NAMES.includes(networkCookieMatch[1] as NetworkName)) {
    preferredNetwork = networkCookieMatch[1] as NetworkName;
  }

  // Only process move-reference paths
  if (!pathname.startsWith("/move-reference")) {
    return undefined;
  }

  // Check for language prefix
  const langPathMatch = /^\/([a-z]{2})(?:\/|$)/.exec(pathname);
  // Ensure langPrefix is always a string
  let langPrefix = "";
  if (langPathMatch?.[1]) {
    langPrefix = "/" + langPathMatch[1];
  }
  const pathWithoutLang = langPathMatch ? pathname.substring(langPathMatch[0].length) : pathname;

  // Check if the path already includes a network
  const networkPathMatch = /^\/move-reference\/([a-z-]+)(\/.*|$)/.exec(pathWithoutLang);

  if (networkPathMatch) {
    const pathNetwork = networkPathMatch[1];
    const remainingPath = networkPathMatch[2] ?? "/";

    // If the network in the path is valid but different from the preferred one, redirect
    if (NETWORK_NAMES.includes(pathNetwork as NetworkName) && pathNetwork !== preferredNetwork) {
      // Construct the new path without template literals
      url.pathname = langPrefix + "/move-reference/" + preferredNetwork + remainingPath;
      return Response.redirect(url);
    }
  } else if (pathWithoutLang === "/move-reference" || pathWithoutLang === "/move-reference/") {
    // If no network is specified in the path, redirect to the preferred network
    // Construct the new path without template literals
    url.pathname = langPrefix + "/move-reference/" + preferredNetwork + "/";
    return Response.redirect(url);
  }

  return undefined;
}
