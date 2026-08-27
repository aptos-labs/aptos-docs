/**
 * Guards the Content Security Policy against the failure mode that blocked
 * Starlight's sidebar restore, gtag, and Mermaid in production:
 *
 * browsers ignore `'unsafe-inline'` when a hash is present in the same
 * directive. Astro 7.2.5+ omits hashes for directives that list
 * `'unsafe-inline'`, which this site relies on for `is:inline` scripts and
 * runtime-injected styles.
 *
 * A second failure mode is Vercel rejecting the deploy when
 * `@astrojs/vercel` writes one CSP route per page and `.vercel/output/config.json`
 * exceeds ~3300kb. `scripts/collapse-csp.mjs` folds those identical headers
 * into a single catch-all route.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CSP_CATCH_ALL_SRC, collapseCspRoutes } from "../scripts/collapse-csp.mjs";
import { createCspConfig } from "../src/config/csp";

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

describe("build script wires CSP collapse before middleware injection", () => {
  it("runs collapse-csp after astro build and before generate-middleware-function", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      scripts: { build: string; "build:collapse-csp": string };
    };
    const build = pkg.scripts.build;
    expect(build).toContain("pnpm build:collapse-csp");
    expect(pkg.scripts["build:collapse-csp"]).toBe("node ./scripts/collapse-csp.mjs");

    const astro = build.indexOf("astro build");
    const collapse = build.indexOf("pnpm build:collapse-csp");
    const middleware = build.indexOf("pnpm build:generate-middleware-function");
    expect(astro).toBeGreaterThan(-1);
    expect(collapse).toBeGreaterThan(astro);
    expect(middleware).toBeGreaterThan(collapse);
  });

  it("wraps the Vercel adapter so collapse runs during a plain astro build", () => {
    const config = readFileSync(join(ROOT, "astro.config.mjs"), "utf8");
    expect(config).toContain("withCollapsedCsp(");
    expect(config).toContain("collapseCspConfigFile");
  });

  it("overrides the Astro preset build command so Vercel runs pnpm build", () => {
    const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
      buildCommand?: string;
    };
    expect(vercel.buildCommand).toBe("pnpm build");
  });
});

describe("built CSP header", () => {
  const vercelConfigPath = join(ROOT, ".vercel/output/config.json");
  const hasVercelConfig = existsSync(vercelConfigPath);

  it.skipIf(!hasVercelConfig)(
    "does not emit script or style hashes that would disable unsafe-inline",
    () => {
      const json = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
        routes?: VercelRoute[];
      };
      const cspRoutes = json.routes?.filter((route) => route.headers?.["content-security-policy"]);
      expect(cspRoutes, "Vercel static headers should include a CSP").toHaveLength(1);
      expect(cspRoutes?.[0]?.src).toBe(CSP_CATCH_ALL_SRC);
      expect(cspRoutes?.[0]?.continue).toBe(true);

      const csp = cspRoutes?.[0]?.headers?.["content-security-policy"] ?? "";
      const scriptElem = /script-src-elem ([^;]*)/.exec(csp)?.[1] ?? "";
      const styleElem = /style-src-elem ([^;]*)/.exec(csp)?.[1] ?? "";

      expect(scriptElem).toContain("'unsafe-inline'");
      expect(scriptElem).not.toMatch(/'sha256-/);
      expect(styleElem).toContain("'unsafe-inline'");
      expect(styleElem).not.toMatch(/'sha256-/);
    },
  );
});
