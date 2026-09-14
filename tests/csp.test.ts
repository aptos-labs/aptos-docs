/**
 * Guards the Content Security Policy against the failure mode that blocked
 * Starlight's sidebar restore, gtag, and Mermaid in production:
 *
 * browsers ignore `'unsafe-inline'` when a hash is present in the same
 * directive. Stay on Astro 7.2.0 and patch it to omit auto hashes when
 * `'unsafe-inline'` is set, then emit one global header via the patched
 * Vercel adapter (`cspMode: "global"`).
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

function readWorkspaceYaml(): string {
  return readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8");
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

describe("serializeCspHeader", () => {
  it("is a hash-free reference of the intended HTTP policy", () => {
    const csp = serializeCspHeader("pagefind");
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).not.toMatch(/sha256-/);
    expect(csp.length).toBeLessThan(4096);
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

describe("pnpm patches (stay on Astro 7.2.0)", () => {
  it("registers the Vercel global-CSP patch and the Astro hash-skip patch", () => {
    const workspace = readWorkspaceYaml();
    expect(workspace).toContain("patches/@astrojs__vercel.patch");
    expect(workspace).toContain("patches/astro.patch");
  });

  it("teaches the Vercel adapter cspMode: global with a continue catch-all", () => {
    const patch = readFileSync(join(ROOT, "patches/@astrojs__vercel.patch"), "utf8");
    expect(patch).toContain("cspMode");
    expect(patch).toContain("global");
    expect(patch).toContain(CSP_CATCH_ALL_SRC);
    expect(patch).toContain("continue: true");
  });

  it("ports Astro 7.2.5 hash suppression for 'unsafe-inline'", () => {
    const patch = readFileSync(join(ROOT, "patches/astro.patch"), "utf8");
    expect(patch).toContain("hasUnsafeInline");
    expect(patch).toContain("unsafe-inline");
  });
});

describe("astro.config and vercel.json", () => {
  it("re-enables Astro CSP and asks the patched adapter for one global header", () => {
    const config = readFileSync(join(ROOT, "astro.config.mjs"), "utf8");
    expect(config).toContain('cspMode: "global"');
    expect(config).toContain("createCspConfig(searchResolution.provider)");
    expect(config).not.toMatch(/staticHeaders:\s*false/);
  });

  it("does not ship a second CSP from vercel.json (dual policies AND-intersect)", () => {
    const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
      buildCommand?: string;
      headers?: { source: string; headers: { key: string; value: string }[] }[];
    };
    expect(vercel.buildCommand, "do not override the dashboard build command").toBeUndefined();

    const keys = (vercel.headers ?? []).flatMap((entry) =>
      entry.headers.map((header) => header.key),
    );
    expect(keys).not.toContain("Content-Security-Policy");
  });
});

describe("built Vercel routing config", () => {
  const vercelConfigPath = join(ROOT, ".vercel/output/config.json");
  const hasVercelConfig = existsSync(vercelConfigPath);

  it.skipIf(!hasVercelConfig)("emits one continue catch-all CSP, not per-path routes", () => {
    const json = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
      routes?: VercelRoute[];
    };
    const cspRoutes = (json.routes ?? []).filter(
      (route) => route.headers?.["content-security-policy"],
    );
    expect(cspRoutes).toHaveLength(1);
    expect(cspRoutes[0]?.src).toBe(CSP_CATCH_ALL_SRC);
    expect(cspRoutes[0]?.continue).toBe(true);
    expect(cspRoutes[0]?.headers?.["content-security-policy"]).toContain("'unsafe-inline'");
    expect(cspRoutes[0]?.headers?.["content-security-policy"]).not.toMatch(/sha256-/);
  });
});
