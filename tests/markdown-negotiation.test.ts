/**
 * Unit tests for the Edge markdown-negotiation middleware. Exercises the
 * routing decisions (which paths get rewritten, which are skipped) without
 * a live Vercel runtime — we assert on the rewrite header emitted by
 * `@vercel/edge`'s `rewrite()` helper.
 */

import { describe, expect, it } from "vitest";
import markdownNegotiation from "../src/middlewares/markdown-negotiation";

function makeRequest(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { method: "GET", headers });
}

function getRewriteTarget(response: Response | undefined): string | null {
  if (!response) return null;
  return response.headers.get("x-middleware-rewrite");
}

describe("markdown-negotiation middleware", () => {
  it("rewrites docs URL to the .md export when Accept: text/markdown", () => {
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/build/sdks", { accept: "text/markdown" }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/build/sdks.md");
  });

  it("emits Vary: Accept so CDNs can cache both HTML and Markdown variants", () => {
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/build/sdks", { accept: "text/markdown" }),
    );
    expect(res?.headers.get("vary")).toBe("Accept");
  });

  it("rewrites the root path to /index.md", () => {
    const res = markdownNegotiation(makeRequest("https://aptos.dev/", { accept: "text/markdown" }));
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/index.md");
  });

  it("rewrites a locale root to /<locale>.md (Starlight strips /index from non-root slugs)", () => {
    // src/content/docs/zh/index.mdx → doc id = `zh` → static path /zh.md.
    // Astro's glob loader generates slugs as
    // `rawSegments.join("/").replace(/\/index$/, "")`, so `zh/index.mdx`
    // becomes `zh`, not `zh/index`. Naively mapping `/zh` to `/zh/index.md`
    // would 404 (verified live on the preview deploy). This test pins the
    // mapping in case someone reads Copilot's locale-root suggestion and
    // tries to "fix" it.
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/zh", { accept: "text/markdown" }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/zh.md");
  });

  it("routes locale subpath URLs to the locale .md export", () => {
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/zh/build/sdks", { accept: "text/markdown" }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/zh/build/sdks.md");
  });

  it("is a no-op when Accept does not include text/markdown", () => {
    const res = markdownNegotiation(makeRequest("https://aptos.dev/build/sdks"));
    expect(res).toBeUndefined();
  });

  it("is a no-op for non-GET/HEAD requests", () => {
    const res = markdownNegotiation(
      new Request("https://aptos.dev/build/sdks", {
        method: "POST",
        headers: { accept: "text/markdown" },
      }),
    );
    expect(res).toBeUndefined();
  });

  it("skips asset paths (e.g. .json, .svg)", () => {
    for (const url of [
      "https://aptos.dev/aptos-spec.json",
      "https://aptos.dev/favicon.svg",
      "https://aptos.dev/build/sdks.md",
    ]) {
      const res = markdownNegotiation(makeRequest(url, { accept: "text/markdown" }));
      expect(getRewriteTarget(res), url).toBeNull();
    }
  });

  it("skips API, _astro, and .well-known prefixes", () => {
    for (const url of [
      "https://aptos.dev/_astro/entry.js",
      "https://aptos.dev/api/og-image.png",
      "https://aptos.dev/.well-known/api-catalog",
    ]) {
      const res = markdownNegotiation(makeRequest(url, { accept: "text/markdown" }));
      expect(getRewriteTarget(res), url).toBeNull();
    }
  });

  it("skips auto-generated reference routes (REST API, Move reference, gas-profiling)", () => {
    for (const url of [
      "https://aptos.dev/rest-api",
      "https://aptos.dev/rest-api/accounts/get-account",
      "https://aptos.dev/move-reference",
      "https://aptos.dev/move-reference/mainnet/aptos-framework/account",
      "https://aptos.dev/gas-profiling/index.html",
    ]) {
      const res = markdownNegotiation(makeRequest(url, { accept: "text/markdown" }));
      expect(getRewriteTarget(res), url).toBeNull();
    }
  });

  it("rewrites sibling paths that only share a prefix with skipped routes", () => {
    // Regression: the pre-fix skip list used `/rest-api/`, which meant a
    // hypothetical `/rest-apis` or `/move-references` page would have been
    // caught too. The exact-or-subpath check lets them through.
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/rest-apis-overview", {
        accept: "text/markdown",
      }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/rest-apis-overview.md");
  });

  it("strips a trailing slash before appending .md", () => {
    for (const [input, expected] of [
      ["https://aptos.dev/build/sdks/", "https://aptos.dev/build/sdks.md"],
      // Locale root with trailing slash should map to `/zh.md`, not `/zh/.md`.
      // Vercel's `trailingSlash: false` handler usually 308-redirects /zh/ → /zh
      // before middleware runs, but defend against direct invocations too.
      ["https://aptos.dev/zh/", "https://aptos.dev/zh.md"],
    ] as const) {
      const res = markdownNegotiation(makeRequest(input, { accept: "text/markdown" }));
      expect(getRewriteTarget(res), input).toBe(expected);
    }
  });

  it("accepts Accept headers with quality values", () => {
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/build/sdks", {
        accept: "text/html;q=0.1, text/markdown;q=0.9",
      }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/build/sdks.md");
  });

  it("treats q=0 on text/markdown as 'not acceptable' (RFC 9110)", () => {
    for (const header of [
      "text/markdown;q=0",
      "text/markdown; q=0.0",
      "text/html, text/markdown;q=0",
    ]) {
      const res = markdownNegotiation(
        makeRequest("https://aptos.dev/build/sdks", { accept: header }),
      );
      expect(res, `Accept: ${header}`).toBeUndefined();
    }
  });

  it("rejects malformed, out-of-range, and zero quality values", () => {
    // Locks in the parser behaviour audited during self-review. A future
    // "simplify the regex" attempt that swaps the token-by-token parse for a
    // looser substring match would silently break these.
    const rejected = [
      "text/markdown;q=", // empty value -> Number("") === 0
      "text/markdown;q=invalid", // NaN
      "text/markdown; q = 0", // whitespace around '='
      "text/markdown;Q=0", // uppercase Q with q=0
      // RFC 9110 §12.4.2 caps qvalues at 0.000–1.000.
      "text/markdown;q=2", // > 1 (out of range)
      "text/markdown;q=1.5", // > 1 (out of range)
      "text/markdown;q=-0.5", // negative
    ];
    for (const header of rejected) {
      const res = markdownNegotiation(
        makeRequest("https://aptos.dev/build/sdks", { accept: header }),
      );
      expect(res, `Accept (rejected): ${header}`).toBeUndefined();
    }

    const accepted = [
      "text/MARKDOWN", // uppercase media type
      "text/markdown;q=1", // boundary value
      "text/markdown;q=1.0",
      "text/markdown;Q=0.5", // uppercase Q with non-zero value
      "text/markdown; charset=utf-8", // unrelated parameters
      "text/markdown ;q=0.7", // space before semicolon
      "text/html, text/markdown ;q=0.9 ;version=2",
    ];
    for (const header of accepted) {
      const res = markdownNegotiation(
        makeRequest("https://aptos.dev/build/sdks", { accept: header }),
      );
      expect(getRewriteTarget(res), `Accept (accepted): ${header}`).toBe(
        "https://aptos.dev/build/sdks.md",
      );
    }
  });

  it("ignores wildcard Accept headers (HTML stays the default)", () => {
    // We only opt into Markdown on an explicit text/markdown listing; a bare
    // `*/*` from a curl default or a `text/*` shouldn't flip the content type.
    for (const header of ["*/*", "text/*", "text/html,*/*;q=0.8"]) {
      const res = markdownNegotiation(
        makeRequest("https://aptos.dev/build/sdks", { accept: header }),
      );
      expect(res, `Accept: ${header}`).toBeUndefined();
    }
  });
});
