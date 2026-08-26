import { copyFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

/**
 * `@astrojs/sitemap` writes `sitemap-0.xml` (urlset) plus `sitemap-index.xml`.
 * Agent scanners and many crawlers fetch `/sitemap.xml` by convention, so copy
 * the canonical urlset (or the index, if the build split into multiple chunks)
 * to that well-known path after the sitemap integration finishes.
 */
export function aliasSitemapXml(outDir: string): string | null {
  if (!existsSync(outDir)) return null;

  const files = readdirSync(outDir);
  const chunks = files.filter((name) => /^sitemap-\d+\.xml$/.test(name)).sort();
  const sourceName =
    chunks.length === 1
      ? chunks[0]
      : files.includes("sitemap-index.xml")
        ? "sitemap-index.xml"
        : null;
  if (!sourceName) return null;

  copyFileSync(join(outDir, sourceName), join(outDir, "sitemap.xml"));
  return sourceName;
}

export function sitemapXmlAlias(): AstroIntegration {
  return {
    name: "sitemap-xml-alias",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const sourceName = aliasSitemapXml(fileURLToPath(dir));
        if (!sourceName) {
          logger.warn("sitemap.xml alias skipped: no sitemap-*.xml or sitemap-index.xml in output");
          return;
        }
        logger.info(`Copied ${sourceName} to sitemap.xml`);
      },
    },
  };
}
