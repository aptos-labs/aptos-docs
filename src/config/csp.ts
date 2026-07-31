import type { AstroUserConfig } from "astro";
import type { SearchProvider } from "./search";

type CspConfig = Exclude<NonNullable<NonNullable<AstroUserConfig["security"]>["csp"]>, boolean>;

/**
 * Helper function to add HTTPS schema to URLs for CSP
 */
const withHttps = (urls: string | string[]): string => {
  const urlArray = Array.isArray(urls) ? urls : [urls];

  return urlArray.map((url: string) => `https://${url}`).join(" ");
};

// CSP Domain Constants
const VERCEL_HOSTS = withHttps(["vercel.live", "vercel.com", "assets.vercel.com"]);
const VERCEL_ANALYTICS_HOSTS = withHttps(["va.vercel-scripts.com", "*.vercel-insights.com"]);
const GOOGLE_HOSTS = withHttps(["*.googleapis.com", "apis.google.com"]);
const GTM_HOST = withHttps("*.googletagmanager.com");
const GA_HOSTS = withHttps([
  "*.google-analytics.com",
  "*.analytics.google.com",
  "*.googletagmanager.com",
  "*.g.doubleclick.net",
  "*.google.com",
]);
const ALGOLIA_HOSTS = withHttps(["*.algolia.net", "*.algolianet.com", "*.algolia.io"]);
const APTOS_HOSTS = withHttps("*.aptoslabs.com");
const TWITTER_HOSTS = withHttps("*.twimg.com");
const FIREBASE_HOSTS = withHttps("aptos-api-gateway-prod.firebaseapp.com");
const VIDEO_HOSTS = withHttps(["player.vimeo.com", "www.youtube.com"]);
const CDN_HOSTS = withHttps("cdn.jsdelivr.net");
const PUSHER_HOSTS = "wss://ws-us3.pusher.com"; // WebSocket, no schema needed
const STACKBLITZ_HOST = withHttps("stackblitz.com");
const FIGMA_HOSTS = withHttps("embed.figma.com");
const GOOGLE_FONTS_HOSTS = withHttps(["fonts.googleapis.com", "fonts.gstatic.com"]);

/**
 * Hash of the `is:inline` script in Starlight's Pagefind search component, which
 * reveals the ⌘K hint in the search button and swaps the modifier key on Apple
 * devices. Astro does not hash `is:inline` scripts, so without this the hint
 * stays hidden. `tests/search-provider.test.ts` recomputes it from the installed
 * Starlight package so a version bump that edits the script fails loudly.
 */
const STARLIGHT_SEARCH_SHORTCUT_HASH = "sha256-f/zAUE74ucc3JYp4r4QQvkJofoQdkOIhHYK+jeZ6eko=";

/**
 * Content Security Policy configuration for Astro.
 *
 * Pagefind searches inside a WebAssembly module running in a Web Worker created
 * from a blob URL, both of which a strict policy blocks by default. The failure
 * is silent — the search modal just never returns results — so the two
 * relaxations are added only for builds that actually ship Pagefind.
 * See https://pagefind.app/docs/hosting/#content-security-policy-csp.
 */
export function createCspConfig(searchProvider: SearchProvider = "algolia") {
  const usesPagefind = searchProvider === "pagefind";

  return {
    directives: [
      "default-src 'self'",
      `img-src 'self' ${TWITTER_HOSTS} ${GOOGLE_HOSTS} ${GTM_HOST} ${GA_HOSTS} ${VERCEL_HOSTS} data: blob:`,
      `font-src 'self' ${VERCEL_HOSTS} ${GOOGLE_FONTS_HOSTS} data:`,
      usesPagefind ? "worker-src 'self' blob:" : "worker-src 'self'",
      `connect-src 'self' ${APTOS_HOSTS} ${ALGOLIA_HOSTS} ${GOOGLE_HOSTS} ${GTM_HOST} ${GA_HOSTS} ${VERCEL_HOSTS} ${PUSHER_HOSTS} ${VERCEL_ANALYTICS_HOSTS}`,
      `frame-src 'self' ${FIREBASE_HOSTS} ${VERCEL_HOSTS} ${VIDEO_HOSTS} ${STACKBLITZ_HOST} ${FIGMA_HOSTS}`,
      `media-src 'self' ${TWITTER_HOSTS}`,
    ],
    styleDirective: {
      resources: [
        { resource: "'self'", kind: "element" },
        { resource: VERCEL_HOSTS, kind: "element" },
        { resource: GOOGLE_FONTS_HOSTS, kind: "element" },
        { resource: "'unsafe-inline'", kind: "element" },
        { resource: "'unsafe-inline'", kind: "attribute" },
      ],
    },
    scriptDirective: {
      resources: [
        // Bare resources land in `script-src`; `kind: "element"` scopes them to
        // `script-src-elem`. WebAssembly is checked against `script-src`, so
        // Pagefind's permission has to be declared without a kind.
        "'self'",
        ...(usesPagefind ? ["'wasm-unsafe-eval'"] : []),
        { resource: "'self'", kind: "element" },
        { resource: "'unsafe-inline'", kind: "element" },
        { resource: CDN_HOSTS, kind: "element" },
        { resource: GOOGLE_HOSTS, kind: "element" },
        { resource: GTM_HOST, kind: "element" },
        { resource: VERCEL_HOSTS, kind: "element" },
      ],
      // Astro 7.1.1 does not automatically include these two virtual Starlight
      // scripts in its generated CSP. Keep their exact hashes here so the theme
      // provider and picker remain functional while retaining a strict policy.
      hashes: [
        { hash: "sha256-VWo5Wp4aqSj6nSgMpeAp9cKieaoIfwFUAunAVugI5gA=", kind: "element" },
        { hash: "sha256-GkZBRnvSuhtx/cvzvukVkX2JJZW+DdPlVr7BX8Tefqo=", kind: "element" },
        ...(usesPagefind
          ? ([{ hash: STARLIGHT_SEARCH_SHORTCUT_HASH, kind: "element" }] as const)
          : []),
      ],
    },
  } satisfies CspConfig;
}
