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
 * Content Security Policy configuration for Astro.
 *
 * Several first-party scripts and styles have to run inline:
 * - Starlight ships `is:inline` scripts (theme, sidebar restore, search
 *   shortcut) that Astro does not hash.
 * - astro-mermaid injects a `<style>` element at runtime on every page.
 *
 * Browsers ignore `'unsafe-inline'` when a hash is present in the same
 * directive. Astro 7.2.5+ therefore omits auto-generated hashes for any
 * directive that lists `'unsafe-inline'`. Do not add `scriptDirective.hashes`
 * or `styleDirective.hashes` here — they would disable that fallback and block
 * Starlight's sidebar restore, gtag, and Mermaid.
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
    },
  } satisfies CspConfig;
}

/**
 * Serialize `createCspConfig` into a Content-Security-Policy header.
 *
 * Used for the global Vercel header. Do not include hashes: browsers ignore
 * `'unsafe-inline'` when a hash is present in the same directive.
 */
export function serializeCspHeader(searchProvider: SearchProvider = "pagefind"): string {
  const csp = createCspConfig(searchProvider);
  const scriptDefault = csp.scriptDirective.resources.filter(
    (resource): resource is string => typeof resource === "string",
  );
  const scriptElem = csp.scriptDirective.resources.flatMap((resource) =>
    typeof resource === "object" && resource.kind === "element" ? [resource.resource] : [],
  );
  const styleElem = csp.styleDirective.resources.flatMap((resource) =>
    resource.kind === "element" ? [resource.resource] : [],
  );
  const styleAttr = csp.styleDirective.resources.flatMap((resource) =>
    resource.kind === "attribute" ? [resource.resource] : [],
  );

  return [
    ...csp.directives,
    `script-src ${scriptDefault.join(" ")}`,
    `script-src-elem ${scriptElem.join(" ")}`,
    "style-src 'self'",
    `style-src-elem ${styleElem.join(" ")}`,
    `style-src-attr ${styleAttr.join(" ")}`,
  ].join("; ");
}
