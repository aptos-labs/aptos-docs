/**
 * Mermaid Rendering Validation Tests
 *
 * These tests ensure that mermaid diagrams in MDX files are correctly
 * transformed into renderable <pre class="mermaid"> elements and not
 * swallowed by Expressive Code or lost during the build pipeline.
 *
 * This has broken at least twice before, so these tests serve as a
 * regression guard.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const CONTENT_DIR = join(ROOT, "src/content/docs");
const FIXTURES_DIR = join(__dirname, "fixtures");

function findMdxFilesWithMermaid(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const fullPath = join(entry.parentPath, entry.name);
    const content = readFileSync(fullPath, "utf-8");
    if (/^```mermaid/m.test(content)) {
      results.push(fullPath);
    }
  }
  return results;
}

function countMermaidBlocks(filePath: string): number {
  const content = readFileSync(filePath, "utf-8");
  return (content.match(/^```mermaid/gm) ?? []).length;
}

function readAstroConfig(): string {
  return readFileSync(join(ROOT, "astro.config.mjs"), "utf-8");
}

/**
 * HTML for the blockchain-deep-dive doc page.
 * Do not match on URL substring alone: many pages embed that path in the sidebar
 * before `network/blockchain/...` is visited, which broke CI (wrong file, no mermaid).
 */
function findBlockchainDeepDiveHtml(distClient: string): string | null {
  if (!existsSync(distClient)) return null;
  const preferred = [
    join(distClient, "network/blockchain/blockchain-deep-dive/index.html"),
    join(distClient, "zh/network/blockchain/blockchain-deep-dive/index.html"),
    join(distClient, "network/blockchain/blockchain-deep-dive.html"),
    join(distClient, "zh/network/blockchain/blockchain-deep-dive.html"),
  ];
  for (const p of preferred) {
    if (existsSync(p)) return p;
  }
  const stack: string[] = [distClient];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const full = join(dir, name);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(full);
      } else if (
        st.isFile() &&
        name.endsWith(".html") &&
        full.includes(`${join("blockchain", "blockchain-deep-dive")}`)
      ) {
        return full;
      }
    }
  }
  return null;
}

function assertDistPresentForMermaidTests(distClient: string, legacyDistDir: string): void {
  const clientExists = existsSync(distClient) && statSync(distClient).isDirectory();
  const legacyExists = existsSync(legacyDistDir) && statSync(legacyDistDir).isDirectory();
  if (!clientExists && !legacyExists) return;
  const htmlPath = findBlockchainDeepDiveHtml(distClient);
  const legacyOk =
    legacyExists &&
    readdirSync(legacyDistDir).some(
      (f) => f.startsWith("blockchain-deep-dive") && f.endsWith(".mjs"),
    );
  if (htmlPath || legacyOk) return;
  const rel = relative(ROOT, distClient) || distClient;
  throw new Error(
    `Build output exists under ${rel} but no HTML was found at network/blockchain/blockchain-deep-dive (or zh/...). Update the mermaid test locator if doc routes changed.`,
  );
}

interface PkgJson {
  dependencies: Record<string, string>;
}

describe("Mermaid Rendering Validation", () => {
  describe("Test fixture", () => {
    const fixturePath = join(FIXTURES_DIR, "mermaid-test.mdx");

    it("should have a fixture MDX file with mermaid blocks", () => {
      expect(existsSync(fixturePath)).toBe(true);
      expect(countMermaidBlocks(fixturePath)).toBe(2);
    });

    it("should contain valid mermaid syntax in the fixture", () => {
      const content = readFileSync(fixturePath, "utf-8");
      expect(content).toMatch(/```mermaid\s+graph (LR|TD)/);
    });
  });

  describe("Production content contains mermaid diagrams", () => {
    it("should have at least one MDX file with mermaid blocks in English docs", () => {
      const files = findMdxFilesWithMermaid(CONTENT_DIR);
      const enFiles = files.filter((f) => !f.includes("/zh/"));
      expect(enFiles.length).toBeGreaterThan(0);
    });

    it("should have at least one MDX file with mermaid blocks in Chinese docs", () => {
      const zhDir = join(CONTENT_DIR, "zh");
      expect(existsSync(zhDir)).toBe(true);
      const files = findMdxFilesWithMermaid(zhDir);
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe("Astro configuration", () => {
    it("should import and use astro-mermaid", () => {
      const config = readAstroConfig();
      expect(config).toMatch(/astro-mermaid/);
      expect(config).toMatch(/mermaid\(\)/);
    });

    it("should have mermaid integration listed before starlight", () => {
      const config = readAstroConfig();
      // Extract just the integrations array to avoid false matches in comments
      const integrationsMatch = /integrations:\s*\[/s.exec(config);
      expect(integrationsMatch).not.toBeNull();
      const integrationsStart = integrationsMatch?.index ?? 0;
      const configFromIntegrations = config.slice(integrationsStart);
      const mermaidPos = configFromIntegrations.indexOf("mermaid()");
      const starlightPos = configFromIntegrations.indexOf("starlight(");
      expect(mermaidPos).toBeGreaterThan(-1);
      expect(starlightPos).toBeGreaterThan(-1);
      expect(mermaidPos).toBeLessThan(starlightPos);
    });

    it("should have mermaid dependencies in package.json", () => {
      const pkgJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as PkgJson;
      expect(pkgJson.dependencies.mermaid).toBeDefined();
      expect(pkgJson.dependencies["astro-mermaid"]).toBeDefined();
    });
  });

  describe("astro-mermaid integration", () => {
    it("should be importable as an Astro integration", async () => {
      const mod = await import("astro-mermaid");
      const integrationFactory = mod.default;
      expect(typeof integrationFactory).toBe("function");

      const integration = integrationFactory();
      expect(integration).toBeDefined();
      expect(integration.name).toBe("astro-mermaid");
      expect(integration.hooks).toBeDefined();
      expect(integration.hooks["astro:config:setup"]).toBeDefined();
    });

    it("should register an astro:after-swap handler for view transitions", () => {
      // Verify the integration source contains the view transitions handler.
      // This is the key fix: the handler must be registered unconditionally
      // so that navigating from a page without diagrams to one with them works.
      const entrypoint = join(
        ROOT,
        "node_modules",
        "astro-mermaid",
        "astro-mermaid-integration.js",
      );
      const content = readFileSync(entrypoint, "utf-8");
      expect(content).toContain("astro:after-swap");
    });
  });

  describe("Build output validation", () => {
    const distClient = join(ROOT, "dist/client");
    const legacyDistDir = join(ROOT, "dist/server/chunks");
    const htmlFile = findBlockchainDeepDiveHtml(distClient);
    const hasHtml = htmlFile !== null;
    const hasLegacy = existsSync(legacyDistDir);

    it("should resolve blockchain-deep-dive HTML when client build output exists", () => {
      assertDistPresentForMermaidTests(distClient, legacyDistDir);
    });

    it.skipIf(!hasHtml && !hasLegacy)(
      "should render mermaid blocks as <pre class='mermaid'>, not as Expressive Code",
      () => {
        if (hasHtml) {
          const content = readFileSync(htmlFile, "utf-8");
          expect(content).toContain('class="mermaid"');
          expect(content).not.toMatch(/expressive-code.*language-mermaid/);
        } else {
          const chunks = readdirSync(legacyDistDir).filter(
            (f) => f.startsWith("blockchain-deep-dive") && f.endsWith(".mjs"),
          );
          expect(chunks.length).toBeGreaterThan(0);
          for (const chunk of chunks) {
            const content = readFileSync(join(legacyDistDir, chunk), "utf-8");
            if (content.includes("graph LR") || content.includes("graph TD")) {
              expect(content).toContain('class=\\"mermaid\\"');
              expect(content).not.toMatch(/expressive-code.*language-mermaid/);
            }
          }
        }
      },
    );

    it.skipIf(!hasHtml && !hasLegacy)(
      "should preserve mermaid diagram content in the rendered output",
      () => {
        if (hasHtml) {
          const content = readFileSync(htmlFile, "utf-8");
          const mermaidMatch = /pre class="mermaid"[^>]*>(.*?)(?=<\/pre>)/s.exec(content);
          expect(mermaidMatch).not.toBeNull();
          if (mermaidMatch) {
            expect(mermaidMatch[1]).toMatch(/graph\s+(LR|TD|TB|RL|BT)/);
          }
        } else {
          const chunks = readdirSync(legacyDistDir).filter(
            (f) => f.startsWith("blockchain-deep-dive") && f.endsWith(".mjs"),
          );
          let foundMermaid = false;
          for (const chunk of chunks) {
            const content = readFileSync(join(legacyDistDir, chunk), "utf-8");
            const mermaidMatch = /pre class=\\"mermaid\\"[^>]*>(.*?)(?=<\/pre>)/s.exec(content);
            if (mermaidMatch) {
              foundMermaid = true;
              expect(mermaidMatch[1]).toMatch(/graph\s+(LR|TD|TB|RL|BT)/);
            }
          }
          expect(foundMermaid).toBe(true);
        }
      },
    );

    it.skipIf(!existsSync(join(ROOT, "dist/client/_astro")))(
      "should bundle the mermaid client-side script",
      () => {
        const astroDir = join(ROOT, "dist/client/_astro");
        const files = readdirSync(astroDir);

        const pageScript = files.find((f) => f.startsWith("page.") && f.endsWith(".js"));
        expect(pageScript).toBeDefined();

        if (pageScript) {
          const content = readFileSync(join(astroDir, pageScript), "utf-8");
          expect(content).toContain("pre.mermaid");
        }
      },
    );

    it.skipIf(!existsSync(join(ROOT, "dist/client/_astro")))(
      "should bundle the mermaid library chunk",
      () => {
        const astroDir = join(ROOT, "dist/client/_astro");
        const files = readdirSync(astroDir);

        const mermaidChunk = files.find((f) => f.includes("mermaid") && f.endsWith(".js"));
        expect(mermaidChunk).toBeDefined();
      },
    );
  });
});
