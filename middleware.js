const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
  },
  {
    code: "zh",
    label: "简体中文",
  },
  {
    code: "ja",
    label: "日本語",
  },
];
const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((lang) => lang.code);
const DEFAULT_LANG = "en";
const NON_DEFAULT_LANGS = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANG);
function middleware$1(request) {
  var _a, _b;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const cookies = request.headers.get("cookie") ?? "";
  const langCookieMatch = /preferred_locale=([a-z-]+)/.exec(cookies);
  let preferredLocale = langCookieMatch ? langCookieMatch[1] : null;
  if (!preferredLocale) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    preferredLocale =
      ((_b = (_a = acceptLanguage.split(",")[0]) == null ? void 0 : _a.split(";")[0]) == null
        ? void 0
        : _b.split("-")[0]) ?? DEFAULT_LANG;
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
  return void 0;
}
async function applyMiddleware(req, middlewares) {
  return middlewares.reduce(
    async (chain, middleware2) => {
      const response = await chain;
      if (response) return response;
      return middleware2(req);
    },
    Promise.resolve(void 0),
  );
}
async function middleware(req) {
  return await applyMiddleware(req, [middleware$1]);
}
export const config = {
  matcher: [
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
  ],
};
export default middleware;
