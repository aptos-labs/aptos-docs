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

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const CONTENT_DIR = join(ROOT, "src/content/docs");

function findMdxFilesWithMermaid(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const fullPath = join(entry.parentPath || dir, entry.name);
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

interface PkgJson {
  dependencies: Record<string, string>;
}

describe("Mermaid Rendering Validation", () => {
  describe("Source files contain mermaid diagrams", () => {
    it("should find MDX files with mermaid code blocks", () => {
      const files = findMdxFilesWithMermaid(CONTENT_DIR);
      expect(files.length).toBeGreaterThan(0);
    });

    it("should have mermaid diagrams in the blockchain deep dive (en)", () => {
      const file = join(CONTENT_DIR, "network/blockchain/blockchain-deep-dive.mdx");
      expect(existsSync(file)).toBe(true);
      expect(countMermaidBlocks(file)).toBeGreaterThanOrEqual(6);
    });

    it("should have mermaid diagrams in the blockchain deep dive (es)", () => {
      const file = join(CONTENT_DIR, "es/network/blockchain/blockchain-deep-dive.mdx");
      expect(existsSync(file)).toBe(true);
      expect(countMermaidBlocks(file)).toBeGreaterThanOrEqual(1);
    });

    it("should have mermaid diagrams in the blockchain deep dive (zh)", () => {
      const file = join(CONTENT_DIR, "zh/network/blockchain/blockchain-deep-dive.mdx");
      expect(existsSync(file)).toBe(true);
      expect(countMermaidBlocks(file)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Astro configuration", () => {
    it("should have astro-mermaid integration configured", () => {
      const config = readAstroConfig();
      expect(config).toContain('import mermaid from "astro-mermaid"');
      expect(config).toMatch(/mermaid\(\)/);
    });

    it("should have astro-mermaid listed before starlight in integrations", () => {
      const config = readAstroConfig();
      const mermaidPos = config.indexOf("mermaid()");
      const starlightPos = config.indexOf("starlight(");
      expect(mermaidPos).toBeGreaterThan(-1);
      expect(starlightPos).toBeGreaterThan(-1);
      expect(mermaidPos).toBeLessThan(starlightPos);
    });

    it("should have mermaid dependency installed", () => {
      const pkgJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as PkgJson;
      expect(pkgJson.dependencies.mermaid).toBeDefined();
      expect(pkgJson.dependencies["astro-mermaid"]).toBeDefined();
    });
  });

  describe("astro-mermaid integration file", () => {
    const integrationPath = join(ROOT, "node_modules/astro-mermaid/astro-mermaid-integration.js");

    it("should exist", () => {
      expect(existsSync(integrationPath)).toBe(true);
    });

    it("should have a remark plugin that transforms mermaid code blocks", () => {
      const content = readFileSync(integrationPath, "utf-8");
      expect(content).toContain("node.lang === 'mermaid'");
      expect(content).toContain('pre class="mermaid"');
    });

    it("should have a rehype plugin that transforms mermaid code blocks", () => {
      const content = readFileSync(integrationPath, "utf-8");
      expect(content).toContain("language-mermaid");
    });

    it("should inject a client-side script that queries pre.mermaid", () => {
      const content = readFileSync(integrationPath, "utf-8");
      expect(content).toContain("pre.mermaid");
      expect(content).toContain("initMermaid");
    });

    it("should register astro:after-swap handler unconditionally", () => {
      const content = readFileSync(integrationPath, "utf-8");
      expect(content).toContain("astro:after-swap");
      // v1.3.x registers the handler outside the conditional mermaid load,
      // with a comment indicating it's always registered
      expect(content).toContain("registered ALWAYS");
    });
  });

  describe("Mermaid integration structure", () => {
    it("should export a valid Astro integration", async () => {
      const mod = await import("astro-mermaid");
      const integration = mod.default();

      expect(integration.name).toBe("astro-mermaid");
      expect(integration.hooks["astro:config:setup"]).toBeDefined();
    });
  });

  describe("Build output validation", () => {
    const distDir = join(ROOT, "dist/server/chunks");

    it.skipIf(!existsSync(distDir))(
      'should contain <pre class="mermaid"> in rendered blockchain-deep-dive chunks',
      () => {
        const chunks = readdirSync(distDir).filter(
          (f) => f.startsWith("blockchain-deep-dive") && f.endsWith(".mjs"),
        );
        expect(chunks.length).toBeGreaterThan(0);

        for (const chunk of chunks) {
          const content = readFileSync(join(distDir, chunk), "utf-8");
          if (content.includes("graph LR") || content.includes("graph TD")) {
            expect(content).toContain('class=\\"mermaid\\"');
            expect(content).not.toMatch(/expressive-code.*language-mermaid/);
          }
        }
      },
    );

    it.skipIf(!existsSync(distDir))(
      "should contain mermaid diagram content in pre.mermaid elements",
      () => {
        const chunks = readdirSync(distDir).filter(
          (f) => f.startsWith("blockchain-deep-dive") && f.endsWith(".mjs"),
        );

        let foundMermaid = false;
        for (const chunk of chunks) {
          const content = readFileSync(join(distDir, chunk), "utf-8");
          const mermaidMatch = /pre class=\\"mermaid\\"[^>]*>(.*?)(?=<\/pre>)/s.exec(content);
          if (mermaidMatch) {
            foundMermaid = true;
            const diagramContent = mermaidMatch[1];
            expect(diagramContent).toMatch(/graph\s+(LR|TD|TB|RL|BT)/);
          }
        }
        expect(foundMermaid).toBe(true);
      },
    );

    it.skipIf(!existsSync(join(ROOT, "dist/client/_astro")))(
      "should have the mermaid client-side script bundled",
      () => {
        const astroDir = join(ROOT, "dist/client/_astro");
        const files = readdirSync(astroDir);

        const pageScript = files.find((f) => f.startsWith("page.") && f.endsWith(".js"));
        expect(pageScript).toBeDefined();

        if (pageScript) {
          const content = readFileSync(join(astroDir, pageScript), "utf-8");
          expect(content).toContain("pre.mermaid");
          expect(content).toContain("astro-mermaid");
        }
      },
    );

    it.skipIf(!existsSync(join(ROOT, "dist/client/_astro")))(
      "should have the mermaid library chunk bundled",
      () => {
        const astroDir = join(ROOT, "dist/client/_astro");
        const files = readdirSync(astroDir);

        const mermaidChunk = files.find((f) => f.includes("mermaid") && f.endsWith(".js"));
        expect(mermaidChunk).toBeDefined();
      },
    );
  });
});
