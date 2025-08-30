import type { IntegrationResolvedRoute } from "astro";

export interface MatcherOptions {
  include?: (string | RegExp)[];
  exclude?: (string | RegExp)[];
}

interface BuildMiddlewareMatcherRegexpOptions extends MatcherOptions {
  assetsDir: string;
  routes: IntegrationResolvedRoute[];
}

export function buildMiddlewareMatcherRegexp({
  routes,
  assetsDir,
  exclude,
  include,
}: BuildMiddlewareMatcherRegexpOptions) {
  const groupedRoutes = Object.groupBy(routes, (r) => r.origin);
  const dontMatchPatterns = [
    `\\/${assetsDir}\\/(.*)`,
    ...(groupedRoutes.internal?.map((r) => stripAstroRoutePatternRegexp(r.patternRegex)) ?? []),
    ...(exclude ?? []).map(stripRoutePattern),
  ];
  const matchPatterns = [...(include ?? []).map(stripRoutePattern)];

  // The regex is constructed to first negate any paths that match the internal patterns
  // and then allow paths that match the project patterns.
  // For example it can output such regexp: /^(?!.*(\/_server-islands\/[^\/]+\/?|\/_image\/?)$)(?:\/(.*))$/;
  return `^(?!.*(${dontMatchPatterns.join("|")})$)(?:${matchPatterns.length ? matchPatterns.join("|") : "\\/.*"})$`;
}

// Strips leading ^ and trailing $ from a RegExp pattern string
const PATTERN_STRIP_LINE_START = /^\^/;
const PATTERN_STRIP_LINE_END = /\$$/;
function stripRoutePattern(pattern: string | RegExp) {
  return pattern
    .toString()
    .replace(PATTERN_STRIP_LINE_START, "")
    .replace(PATTERN_STRIP_LINE_END, "");
}

function stripAstroRoutePatternRegexp(pattern: RegExp) {
  return stripRoutePattern(pattern.toString().slice(1, -1));
}
