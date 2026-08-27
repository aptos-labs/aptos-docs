/**
 * Guards the Content Security Policy against the failure mode that blocked
 * Starlight's sidebar restore, gtag, and Mermaid in production:
 *
 * browsers ignore `'unsafe-inline'` when a hash is present in the same
 * directive. Astro 7.2.0 injects those hashes, so this site ships a hash-free
 * HTTP policy from `vercel.json` (`serializeCspHeader`) instead of Astro CSP.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CSP_CATCH_ALL_SRC, collapseCspRoutes } from "../scripts/collapse-csp.mjs";
import { createCspConfig, serializeCspHeader } from "../src/config/csp";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const SHARED_CSP =
  "default-src 'self'; script-src-elem 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'";

type CspResource = string | { resource: string; kind?: string };

type VercelRoute = {
  src?: string;
  handle?: string;
  continue?: boolean;
  headers?: Record<string, string>;
};

type CollapseInput = { routes: VercelRoute[] };

function elementResources(resources: CspResource[]): string[] {
  return resources.flatMap((resource) => {
    if (typeof resource === "string") return [];
    return resource.kind === "element" ? [resource.resource] : [];
  });
}

describe("createCspConfig", () => {
  it("allows inline scripts without hashes so Starlight is:inline scripts run", () => {
    for (const provider of ["algolia", "pagefind"] as const) {
      const config = createCspConfig(provider);
      expect(elementResources(config.scriptDirective.resources)).toContain("'unsafe-inline'");
      expect(config.scriptDirective).not.toHaveProperty("hashes");
    }
  });

  it("allows inline styles without hashes so mermaid can inject a stylesheet", () => {
    const config = createCspConfig("algolia");
    expect(elementResources(config.styleDirective.resources)).toContain("'unsafe-inline'");
    expect(config.styleDirective).not.toHaveProperty("hashes");
  });
});

describe("collapseCspRoutes", () => {
  it("folds identical per-route CSPs into one continue catch-all", () => {
    const json: CollapseInput = {
      routes: [
        { handle: "filesystem" },
        { src: "/", headers: { "content-security-policy": SHARED_CSP } },
        { src: "/about", headers: { "content-security-policy": SHARED_CSP } },
        {
          src: "/other",
          headers: { "cache-control": "max-age=0", "content-security-policy": SHARED_CSP },
        },
      ],
    };

    const result = collapseCspRoutes(json);

    expect(result).toMatchObject({ changed: true, reason: "collapsed", cspCount: 3 });
    expect(json.routes[0]).toEqual({
      src: CSP_CATCH_ALL_SRC,
      headers: { "content-security-policy": SHARED_CSP },
      continue: true,
    });
    expect(json.routes.filter((route) => route.headers?.["content-security-policy"])).toHaveLength(
      1,
    );
    expect(json.routes).toContainEqual({ handle: "filesystem" });
    expect(json.routes).toContainEqual({
      src: "/other",
      headers: { "cache-control": "max-age=0" },
    });
    expect(json.routes.some((route) => route.src === "/")).toBe(false);
    expect(json.routes.some((route) => route.src === "/about")).toBe(false);
  });

  it("is idempotent when the catch-all is already in place", () => {
    const json: CollapseInput = {
      routes: [
        {
          src: CSP_CATCH_ALL_SRC,
          headers: { "content-security-policy": SHARED_CSP },
          continue: true,
        },
        { handle: "filesystem" },
      ],
    };

    expect(collapseCspRoutes(json)).toMatchObject({
      changed: false,
      reason: "already-collapsed",
    });
    expect(json.routes).toHaveLength(2);
  });

  it("leaves per-route headers in place when CSP values differ", () => {
    const json: CollapseInput = {
      routes: [
        { src: "/", headers: { "content-security-policy": SHARED_CSP } },
        {
          src: "/about",
          headers: { "content-security-policy": `${SHARED_CSP}; img-src 'self'` },
        },
      ],
    };

    expect(collapseCspRoutes(json)).toMatchObject({ changed: false, reason: "distinct-csp" });
    expect(json.routes).toHaveLength(2);
  });
});

describe("vercel.json CSP header", () => {
  it("ships one global hash-free policy that matches serializeCspHeader", () => {
    const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
      buildCommand?: string;
      headers?: { source: string; headers: { key: string; value: string }[] }[];
    };
    expect(vercel.buildCommand, "do not override the dashboard build command").toBeUndefined();

    const global = vercel.headers?.find((entry) => entry.source === "/(.*)");
    const csp = global?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
    expect(csp).toBe(serializeCspHeader("pagefind"));
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).not.toMatch(/sha256-/);
    expect(csp?.length ?? 0).toBeLessThan(4096);
  });

  it("does not ask the Vercel adapter to emit per-path CSP routes", () => {
    const config = readFileSync(join(ROOT, "astro.config.mjs"), "utf8");
    expect(config).toMatch(/staticHeaders:\s*false/);
    expect(config).not.toContain("withCollapsedCsp");
  });
});

describe("built Vercel routing config", () => {
  const vercelConfigPath = join(ROOT, ".vercel/output/config.json");
  const hasVercelConfig = existsSync(vercelConfigPath);

  it.skipIf(!hasVercelConfig)("does not emit per-path CSP header routes", () => {
    const json = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      routes?: VercelRoute[];
    };
    const perPath = (json.routes ?? []).filter((route) => {
      const csp = route.headers?.["content-security-policy"];
      if (!csp) return false;
      return route.src !== CSP_CATCH_ALL_SRC && route.src !== "/(.*)";
    });
    expect(perPath).toHaveLength(0);
  });
});
