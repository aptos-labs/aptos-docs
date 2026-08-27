/**
 * Guards the Content Security Policy against the failure mode that blocked
 * Starlight's sidebar restore, gtag, and Mermaid in production:
 *
 * browsers ignore `'unsafe-inline'` when a hash is present in the same
 * directive. Astro 7.2.5+ omits hashes for directives that list
 * `'unsafe-inline'`, which this site relies on for `is:inline` scripts and
 * runtime-injected styles.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createCspConfig } from "../src/config/csp";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

type CspResource = string | { resource: string; kind?: string };

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

describe("built CSP header", () => {
  const vercelConfigPath = join(ROOT, ".vercel/output/config.json");
  const hasVercelConfig = existsSync(vercelConfigPath);

  it.skipIf(!hasVercelConfig)(
    "does not emit script or style hashes that would disable unsafe-inline",
    () => {
      const json = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
        routes?: { headers?: Record<string, string> }[];
      };
      const csp = json.routes?.find((route) => route.headers?.["content-security-policy"])
        ?.headers?.["content-security-policy"];
      expect(csp, "global-csp integration should collapse CSP into one route header").toBeTruthy();

      const scriptElem = /script-src-elem ([^;]*)/.exec(csp ?? "")?.[1] ?? "";
      const styleElem = /style-src-elem ([^;]*)/.exec(csp ?? "")?.[1] ?? "";

      expect(scriptElem).toContain("'unsafe-inline'");
      expect(scriptElem).not.toMatch(/'sha256-/);
      expect(styleElem).toContain("'unsafe-inline'");
      expect(styleElem).not.toMatch(/'sha256-/);
    },
  );
});
