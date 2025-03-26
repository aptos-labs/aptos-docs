// src/config/locales.ts
var SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "\u7B80\u4F53\u4E2D\u6587" },
  { code: "ja", label: "\u65E5\u672C\u8A9E" },
];

// src/middlewares/i18n-redirect.ts
var LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
var DEFAULT_LANG = "en";
var NON_DEFAULT_LANGS = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANG);
function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/@fs/") ||
    pathname.startsWith("/src/") ||
    pathname.startsWith("/~partytown/") ||
    pathname === "/favicon.svg"
  ) {
    return;
  }
  const cookies = request.headers.get("cookie") ?? "";
  const langCookieMatch = /preferred_locale=([a-z-]+)/.exec(cookies);
  let preferredLocale = langCookieMatch ? langCookieMatch[1] : null;
  if (!preferredLocale) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    preferredLocale = acceptLanguage.split(",")[0]?.split(";")[0]?.split("-")[0] ?? DEFAULT_LANG;
  }
  const langPathMatch = /^\/([a-z]{2})(\/.*|$)/.exec(pathname);
  const currentLang = langPathMatch ? langPathMatch[1] : DEFAULT_LANG;
  if (currentLang !== preferredLocale) {
    if (preferredLocale === DEFAULT_LANG) {
      url.pathname = langPathMatch ? langPathMatch[2] || "/" : pathname;
    } else if (NON_DEFAULT_LANGS.includes(preferredLocale)) {
      if (!langPathMatch) {
        url.pathname = `/${preferredLocale}${pathname}`;
      } else {
        url.pathname = `/${preferredLocale}${langPathMatch[2] || "/"}`;
      }
    }
    if (url.pathname !== pathname) {
      return Response.redirect(url);
    }
  }
  return void 0;
}

// src/middlewares/matcher-routes-dynamic.js
var matcher = [
  "/",
  "/build/:path*",
  "/guides/:path*",
  "/network/:path*",
  "/reference/:path*",
  "/move-reference",
  "/move-reference/:path*",
  "/zh$",
  "/zh/build/:path*",
  "/zh/guides/:path*",
  "/zh/network/:path*",
  "/zh/reference/:path*",
  "/zh/move-reference",
  "/zh/move-reference/:path*",
  "/ja$",
  "/ja/build/:path*",
  "/ja/guides/:path*",
  "/ja/network/:path*",
  "/ja/reference/:path*",
  "/ja/move-reference",
  "/ja/move-reference/:path*",
];

// src/vercel-edge-middleware.ts
var config = {
  matcher,
};
async function applyMiddleware(req, middlewares) {
  return middlewares.reduce(
    async (chain, middleware3) => {
      const response = await chain;
      if (response) return response;
      return middleware3(req);
    },
    Promise.resolve(void 0),
  );
}
async function middleware2(req) {
  return await applyMiddleware(req, [
    middleware,
    // Add more middleware functions here as needed
  ]);
}
export { config, middleware2 as default };
