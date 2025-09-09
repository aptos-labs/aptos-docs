import type { CspDirective } from "astro/dist/core/csp/config";

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
    `frame-src 'self' ${FIREBASE_HOSTS} ${VERCEL_HOSTS} ${VIDEO_HOSTS} ${STACKBLITZ_HOST}`,
    `media-src 'self' ${TWITTER_HOSTS}`,
    "style-src-attr 'unsafe-inline'",
    `script-src-elem 'self' 'unsafe-inline' ${CDN_HOSTS} ${GOOGLE_HOSTS} ${GTM_HOST} ${VERCEL_HOSTS}`,
    `style-src-elem 'self' 'unsafe-inline' ${VERCEL_HOSTS} ${GOOGLE_FONTS_HOSTS}`,
  ] as CspDirective[],
  styleDirective: {
    resources: ["'self'", VERCEL_HOSTS, "'unsafe-inline'"],
  },
  scriptDirective: {
    resources: ["'self'", "'unsafe-inline'", CDN_HOSTS, GOOGLE_HOSTS, GTM_HOST, VERCEL_HOSTS],
    // hashes: [
    //   "sha256-",
    // ] as CspHash[],
  },
};
