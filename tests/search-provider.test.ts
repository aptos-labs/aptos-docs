/**
 * Unit tests for the build-time search provider resolution.
 *
 * The Algolia application backing DocSearch lives outside this repository, so a
 * deleted app or rotated key silently breaks search on every page. These tests
 * pin the rules that decide when the build falls back to Pagefind and when it
 * keeps DocSearch despite a failed probe.
 */

import { describe, expect, it } from "vitest";
import { createCspConfig } from "../src/config/csp";
import { checkAlgoliaHealth, resolveSearchProvider } from "../src/config/search";

const credentials = {
  appId: "TESTAPPID1",
  apiKey: "test-search-key",
  indexName: "aptos-starlight",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Node's fetch reports DNS failures as a TypeError with a `cause.code`. */
function dnsFailure(code = "ENOTFOUND"): Error {
  return new TypeError("fetch failed", { cause: Object.assign(new Error(code), { code }) });
}

describe("checkAlgoliaHealth", () => {
  it("queries the application's DSN host with the search key", async () => {
    let requestedUrl = "";
    let requestedHeaders: Headers | undefined;

    await checkAlgoliaHealth(credentials, {
      fetchImpl: (url, init) => {
        requestedUrl = url;
        requestedHeaders = new Headers(init?.headers);
        return Promise.resolve(jsonResponse({ nbHits: 42 }));
      },
    });

    expect(requestedUrl).toBe("https://testappid1-dsn.algolia.net/1/indexes/aptos-starlight/query");
    expect(requestedHeaders?.get("x-algolia-application-id")).toBe("TESTAPPID1");
    expect(requestedHeaders?.get("x-algolia-api-key")).toBe("test-search-key");
  });

  it("reports a healthy index with its record count", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.resolve(jsonResponse({ nbHits: 1234 })),
    });
    expect(health).toMatchObject({ healthy: true, reason: "ok", nbHits: 1234 });
  });

  it("treats an unresolvable application as a permanent failure", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.reject(dnsFailure()),
    });
    expect(health).toMatchObject({
      healthy: false,
      reason: "unknown-application",
      transient: false,
    });
  });

  it("treats a rejected API key as a permanent failure", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.resolve(jsonResponse({ message: "Invalid API key" }, 403)),
    });
    expect(health).toMatchObject({ healthy: false, reason: "unauthorized", transient: false });
  });

  it("treats a missing index as a permanent failure", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.resolve(jsonResponse({ message: "Index not found" }, 404)),
    });
    expect(health).toMatchObject({ healthy: false, reason: "unknown-index", transient: false });
  });

  it("treats an index with no records as unusable", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.resolve(jsonResponse({ nbHits: 0 })),
    });
    expect(health).toMatchObject({ healthy: false, reason: "empty-index", transient: false });
  });

  it("treats a server error or timeout as transient", async () => {
    const serverError = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.resolve(jsonResponse({}, 503)),
    });
    expect(serverError).toMatchObject({ healthy: false, transient: true });

    const timedOut = await checkAlgoliaHealth(credentials, {
      fetchImpl: () => Promise.reject(new DOMException("aborted", "AbortError")),
    });
    expect(timedOut).toMatchObject({ healthy: false, reason: "network-error", transient: true });
  });

  it("aborts the probe once the timeout elapses", async () => {
    const health = await checkAlgoliaHealth(credentials, {
      timeoutMs: 10,
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    });
    expect(health).toMatchObject({ healthy: false, transient: true });
  });
});

describe("resolveSearchProvider", () => {
  const healthy = () => Promise.resolve(jsonResponse({ nbHits: 10 }));

  it("uses Algolia when the index is healthy", async () => {
    const resolution = await resolveSearchProvider({ credentials, fetchImpl: healthy });
    expect(resolution.provider).toBe("algolia");
  });

  it("falls back to Pagefind when the application no longer exists", async () => {
    const resolution = await resolveSearchProvider({
      credentials,
      fetchImpl: () => Promise.reject(dnsFailure()),
    });
    expect(resolution.provider).toBe("pagefind");
    expect(resolution.reason).toContain("unknown-application");
  });

  it("falls back to Pagefind when the probe cannot confirm the index", async () => {
    // An unverified Algolia is not worth shipping: Pagefind always works, so a
    // build that cannot prove DocSearch will serve results uses the local index.
    const resolution = await resolveSearchProvider({
      credentials,
      fetchImpl: () => Promise.resolve(jsonResponse({}, 502)),
    });
    expect(resolution.provider).toBe("pagefind");
    expect(resolution.reason).toContain("could not be verified");
  });

  it("uses Pagefind when Algolia is not configured", async () => {
    const resolution = await resolveSearchProvider({
      credentials: { appId: "", apiKey: "", indexName: "" },
      fetchImpl: () => Promise.reject(new Error("should not be called")),
    });
    expect(resolution.provider).toBe("pagefind");
  });

  it("honours SEARCH_PROVIDER=pagefind without probing Algolia", async () => {
    const resolution = await resolveSearchProvider({
      credentials,
      override: "pagefind",
      fetchImpl: () => Promise.reject(new Error("should not be called")),
    });
    expect(resolution.provider).toBe("pagefind");
  });

  it("honours SEARCH_PROVIDER=algolia without probing Algolia", async () => {
    const resolution = await resolveSearchProvider({
      credentials,
      override: "ALGOLIA",
      fetchImpl: () => Promise.reject(new Error("should not be called")),
    });
    expect(resolution.provider).toBe("algolia");
  });

  it("ignores an unrecognised SEARCH_PROVIDER value and probes instead", async () => {
    const resolution = await resolveSearchProvider({
      credentials,
      override: "elasticsearch",
      fetchImpl: healthy,
    });
    expect(resolution.provider).toBe("algolia");
  });

  it("skips the probe when SKIP_SEARCH_HEALTH_CHECK is set", async () => {
    const resolution = await resolveSearchProvider({
      credentials,
      skipHealthCheck: true,
      fetchImpl: () => Promise.reject(new Error("should not be called")),
    });
    expect(resolution.provider).toBe("algolia");
  });
});

describe("createCspConfig", () => {
  const workerSrc = (provider: "algolia" | "pagefind") =>
    createCspConfig(provider).directives.find((directive) => directive.startsWith("worker-src"));
  const scriptResources = (provider: "algolia" | "pagefind") =>
    createCspConfig(provider).scriptDirective.resources;

  it("allows Pagefind's WebAssembly and blob worker when Pagefind ships", () => {
    // Both are silent failures if missing: the search modal opens but never
    // returns results. See https://pagefind.app/docs/hosting/.
    expect(scriptResources("pagefind")).toContain("'wasm-unsafe-eval'");
    expect(workerSrc("pagefind")).toBe("worker-src 'self' blob:");
  });

  it("keeps the stricter policy when DocSearch ships", () => {
    expect(scriptResources("algolia")).not.toContain("'wasm-unsafe-eval'");
    expect(workerSrc("algolia")).toBe("worker-src 'self'");
  });

  it("keeps 'self' in script-src for both providers", () => {
    // Astro drops its implicit `script-src 'self'` as soon as the config
    // contributes an unscoped resource, so it has to be declared explicitly.
    expect(scriptResources("algolia")).toContain("'self'");
    expect(scriptResources("pagefind")).toContain("'self'");
  });

  it("keeps Algolia hosts reachable so DocSearch can query them", () => {
    const connectSrc = createCspConfig("algolia").directives.find((directive) =>
      directive.startsWith("connect-src"),
    );
    expect(connectSrc).toContain("https://*.algolia.net");
    expect(connectSrc).toContain("https://*.algolianet.com");
  });
});
