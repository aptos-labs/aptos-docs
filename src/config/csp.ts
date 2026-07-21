import type { AstroUserConfig } from "astro";

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
 * Content Security Policy configuration for Astro
 */
export const cspConfig = {
  directives: [
    "default-src 'self'",
    `img-src 'self' ${TWITTER_HOSTS} ${GOOGLE_HOSTS} ${GTM_HOST} ${GA_HOSTS} ${VERCEL_HOSTS} data: blob:`,
    `font-src 'self' ${VERCEL_HOSTS} ${GOOGLE_FONTS_HOSTS} data:`,
    "worker-src 'self'",
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
    ],
  },
} satisfies CspConfig;
