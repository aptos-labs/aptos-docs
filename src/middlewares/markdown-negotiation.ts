/**
 * Content negotiation for agents that ask for Markdown.
 *
 * When a request sends `Accept: text/markdown` (or `text/markdown; q=...`)
 * for a documentation URL that has a matching rendered `.md` export, we
 * internally rewrite the request so the response body is Markdown while the
 * browser default stays HTML.
 *
 * The docs site already ships per-page Markdown via `src/pages/[...slug].md.ts`,
 * so a rewrite is all we need — no body transformation happens here.
 *
 * Spec references:
 *   - https://www.rfc-editor.org/rfc/rfc9110#field.accept
 *   - https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 */
import { rewrite } from "@vercel/edge";

// Skip anything that already has an extension we should leave alone.
const SKIP_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".xml",
  ".js",
  ".css",
  ".map",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp4",
  ".webm",
  ".pdf",
  ".zip",
  ".wasm",
]);

// Paths that are not doc routes (API routes, assets, etc.). Skipped either
// as a strict prefix (`/api/`) or as an exact path (`/rest-api`). Keeping the
// two lists separate avoids accidentally rewriting sibling routes like a
// future `/rest-apis` or `/move-references` page.
const SKIP_PREFIXES = ["/_", "/api/", "/.well-known/", "/scripts/"];
const SKIP_EXACT_OR_SUBPATH = ["/rest-api", "/move-reference", "/gas-profiling"];

/**
 * Returns true when the `Accept` header explicitly lists `text/markdown` with
 * a non-zero quality value. Per RFC 9110 §12.4.2, `q=0` means "not acceptable",
 * so `Accept: text/markdown;q=0` must fall back to HTML instead of rewriting
 * to `.md`. We don't try to handle wildcards (`* /*`, `text/*`) because HTML
 * is the canonical representation and we only opt into Markdown on an
 * explicit request.
 */
function acceptsMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  for (const part of accept.split(",")) {
    const [rawMediaType, ...rawParams] = part.split(";");
    const mediaType = (rawMediaType ?? "").trim().toLowerCase();
    if (mediaType !== "text/markdown") continue;

    const qParam = rawParams.map((param) => param.trim()).find((param) => /^q\s*=/i.test(param));
    if (!qParam) return true;

    const rawQ = qParam.slice(qParam.indexOf("=") + 1).trim();
    const q = Number(rawQ);
    if (Number.isFinite(q) && q > 0) return true;
  }
  return false;
}

function hasSkippedExtension(pathname: string): boolean {
  const lastSlash = pathname.lastIndexOf("/");
  const tail = lastSlash === -1 ? pathname : pathname.slice(lastSlash);
  const dotIdx = tail.lastIndexOf(".");
  if (dotIdx === -1) return false;
  return SKIP_EXTENSIONS.has(tail.slice(dotIdx).toLowerCase());
}

export default function middleware(request: Request): Response | undefined {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return undefined;
  }

  const accept = request.headers.get("accept");
  if (!acceptsMarkdown(accept)) {
    return undefined;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  if (hasSkippedExtension(pathname)) {
    return undefined;
  }

  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return undefined;
  }

  if (SKIP_EXACT_OR_SUBPATH.some((base) => pathname === base || pathname.startsWith(`${base}/`))) {
    return undefined;
  }

  // Strip trailing slash so "/foo/" becomes "/foo.md" (root is handled below).
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // The index page ships as `/index.md` (from src/content/docs/index.mdx -> id "index").
  const targetPath = normalized === "/" ? "/index.md" : `${normalized}.md`;

  const rewriteUrl = new URL(url);
  rewriteUrl.pathname = targetPath;

  return rewrite(rewriteUrl, {
    headers: {
      Vary: "Accept",
    },
  });
}
