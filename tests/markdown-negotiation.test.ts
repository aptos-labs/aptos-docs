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

  it("routes locale URLs to the locale .md export", () => {
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
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/build/sdks/", {
        accept: "text/markdown",
      }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/build/sdks.md");
  });

  it("accepts Accept headers with quality values", () => {
    const res = markdownNegotiation(
      makeRequest("https://aptos.dev/build/sdks", {
        accept: "text/html;q=0.1, text/markdown;q=0.9",
      }),
    );
    expect(getRewriteTarget(res)).toBe("https://aptos.dev/build/sdks.md");
  });
});
