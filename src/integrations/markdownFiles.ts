import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

function findMdxFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

export function markdownFilesIntegration(): AstroIntegration {
  return {
    name: "markdown-files",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        // dir is the Astro output directory (e.g., dist/client/)
        // The Vercel adapter will copy this to .vercel/output/static/
        const outputDir = fileURLToPath(dir);
        const contentDir = path.resolve("src/content/docs");

        if (!fs.existsSync(outputDir)) {
          logger.warn(`Output directory not found: ${outputDir}`);
          return;
        }

        const mdxFiles = findMdxFiles(contentDir);
        logger.info(`Generating ${String(mdxFiles.length)} markdown files...`);

        let count = 0;
        for (const mdxPath of mdxFiles) {
          const relativePath = path.relative(contentDir, mdxPath);
          const outputPath = path.join(outputDir, relativePath.replace(/\.mdx$/, ".md"));

          try {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.copyFileSync(mdxPath, outputPath);
            count++;
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Failed to copy "${relativePath}": ${message}`);
            throw err;
          }
        }

        logger.info(`Generated ${String(count)} markdown files`);
      },
    },
  };
}
