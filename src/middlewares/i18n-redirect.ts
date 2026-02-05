import { SUPPORTED_LANGUAGES } from "../config/i18n";

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
const DEFAULT_LANG = "en";
const NON_DEFAULT_LANGS = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANG);

const MOST_COMMON_CRAWLERS = [
  "Googlebot\\/",
  "Googlebot-Mobile",
  "Googlebot-Image",
  "Googlebot-News",
  "Googlebot-Video",
  "AdsBot-Google([^-]|$)",
  "AdsBot-Google-Mobile",
  "Feedfetcher-Google",
  "Mediapartners-Google",
  "Mediapartners \\(Googlebot\\)",
  "APIs-Google",
  "Google-InspectionTool",
  "Storebot-Google",
  "GoogleOther",
  "bingbot",
  "LinkedInBot",
  "yandex\\.com\\/bots",
  "Baiduspider",
  "ezooms",
  "heritrix",
  "Ahrefs(Bot|SiteAudit)",
  "IndeedBot",
  "ZoominfoBot",
  "SeznamBot",
  "facebookexternalhit",
  "Twitterbot",
  "BUbiNG",
  "Applebot",
  "Slack-ImgProxy",
  "SkypeUriPreview",
  "Slackbot",
  "redditbot",
  "Google-Adwords-Instant",
  "WhatsApp",
  "pinterest\\.com\\/bot",
  "BingPreview\\/",
  "Yahoo Link Preview",
  "Discordbot",
  "TelegramBot",
  "DuckDuckGo-Favicons-Bot",
  "^Apache-HttpClient",
  "AppEngine-Google",
  "Google Web Preview",
  "Baidu-YunGuanCe",
  "FlipboardProxy",
  "google-xrawler",
  "Amazon CloudFront",
  "Google-Structured-Data-Testing-Tool",
  "ZoomBot",
  "W3C_Validator",
].map((crawler) => new RegExp(crawler, "i"));

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) {
    return true; // Default to true if user-agent is not provided
  }

  return MOST_COMMON_CRAWLERS.some((regexp) => regexp.test(userAgent));
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export default function middleware(request: Request): Response | void {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if the request is from a crawler
  const userAgent = request.headers.get("user-agent");

  if (isCrawler(userAgent)) {
    return undefined; // Do not redirect crawlers
  }

  // Check for cookie
  const cookies = request.headers.get("cookie") ?? "";
  const langCookieMatch = /preferred_locale=([a-z-]+)/.exec(cookies);
  let preferredLocale = langCookieMatch ? langCookieMatch[1] : null;

  // Fallback to Accept-Language
  if (!preferredLocale) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    preferredLocale = acceptLanguage.split(",")[0]?.split(";")[0]?.split("-")[0] ?? DEFAULT_LANG;
  }

  const langPathMatch = /^\/([a-z]{2})(\/.*|$)/.exec(pathname);
  const currentLang = langPathMatch ? langPathMatch[1] : DEFAULT_LANG;

  if (currentLang !== preferredLocale) {
    if (preferredLocale === DEFAULT_LANG) {
      url.pathname = langPathMatch ? (langPathMatch[2] ?? "/") : pathname;
    } else if (NON_DEFAULT_LANGS.includes(preferredLocale)) {
      if (!langPathMatch) {
        url.pathname = `/${preferredLocale}${pathname}`;
      } else {
        url.pathname = `/${preferredLocale}${langPathMatch[2] ?? "/"}`;
      }
    }

    if (url.pathname !== pathname) {
      return Response.redirect(url);
    }
  }

  return undefined;
}
