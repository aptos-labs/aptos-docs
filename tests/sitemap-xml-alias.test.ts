import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { aliasSitemapXml } from "../src/integrations/sitemap-xml-alias";

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "sitemap-xml-alias-"));
  temps.push(dir);
  return dir;
}

describe("aliasSitemapXml", () => {
  it("copies a single sitemap chunk to sitemap.xml", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "sitemap-0.xml"),
      "<urlset><url><loc>https://aptos.dev/</loc></url></urlset>",
    );
    writeFileSync(join(dir, "sitemap-index.xml"), "<sitemapindex></sitemapindex>");

    expect(aliasSitemapXml(dir)).toBe("sitemap-0.xml");
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toContain("<urlset>");
  });

  it("copies sitemap-index.xml when multiple chunks exist", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "sitemap-0.xml"), "<urlset>0</urlset>");
    writeFileSync(join(dir, "sitemap-1.xml"), "<urlset>1</urlset>");
    writeFileSync(join(dir, "sitemap-index.xml"), "<sitemapindex>index</sitemapindex>");

    expect(aliasSitemapXml(dir)).toBe("sitemap-index.xml");
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toContain("<sitemapindex>");
  });

  it("returns null when the output directory is missing or empty of sitemaps", () => {
    expect(aliasSitemapXml(join(tempDir(), "missing"))).toBeNull();
    const empty = tempDir();
    mkdirSync(join(empty, "nested"));
    expect(aliasSitemapXml(empty)).toBeNull();
  });
});
