import { SUPPORTED_LANGUAGES } from "../config/locales";

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
const DEFAULT_LANG = "en";
const NON_DEFAULT_LANGS = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANG);

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export default function middleware(request: Request): Response | void {
  const url = new URL(request.url);
  const pathname = url.pathname;

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
