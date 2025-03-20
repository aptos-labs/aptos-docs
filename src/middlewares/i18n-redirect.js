import { SUPPORTED_LANGUAGES } from "../config/locales.ts";

// Extract language codes for easier access
const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
const DEFAULT_LANG = "en";
const NON_DEFAULT_LANGS = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANG);

export default function middleware(request) {
  const url = new URL(request.url);

  // 1. Check for language cookie first
  const cookies = request.headers.get("cookie") || "";
  const langCookieMatch = cookies.match(/preferred_locale=([a-z-]+)/);
  let preferredLocale = langCookieMatch ? langCookieMatch[1] : null;

  // 2. Fall back to Accept-Language header if no cookie
  if (!preferredLocale) {
    const acceptLanguage = request.headers.get("accept-language") || "";
    preferredLocale = acceptLanguage.split(",")[0].split(";")[0].split("-")[0];
  }

  // Check if we're on a language path
  const langPathMatch = url.pathname.match(/^\/([a-z]{2})(\/.*|$)/);
  const currentLang = langPathMatch ? langPathMatch[1] : DEFAULT_LANG;

  // If current language doesn't match preferred language, redirect
  if (currentLang !== preferredLocale) {
    if (preferredLocale === DEFAULT_LANG) {
      // Remove language prefix for default language
      url.pathname = langPathMatch ? langPathMatch[2] || "/" : url.pathname;
    } else if (NON_DEFAULT_LANGS.includes(preferredLocale)) {
      // Add language prefix for non-default languages
      if (!langPathMatch) {
        url.pathname = `/${preferredLocale}${url.pathname}`;
      } else {
        // Replace existing language prefix
        url.pathname = `/${preferredLocale}${langPathMatch[2]}`;
      }
    }

    // Only redirect if the path actually changed
    if (url.pathname !== new URL(request.url).pathname) {
      return Response.redirect(url);
    }
  }

  return undefined;
}
