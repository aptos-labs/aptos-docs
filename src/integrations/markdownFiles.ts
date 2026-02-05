import fs from "node:fs";
import path from "node:path";
import type { AstroIntegration } from "astro";

async function waitForDir(dirPath: string, timeoutMs = 30000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(dirPath)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

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
      "astro:build:done": async ({ logger }) => {
        const staticDir = path.resolve(".vercel/output/static");
        const contentDir = path.resolve("src/content/docs");

        const ready = await waitForDir(staticDir);
        if (!ready) {
          logger.warn("Vercel static dir not found; skipping markdown generation");
          return;
        }

        const mdxFiles = findMdxFiles(contentDir);
        logger.info(`Generating ${String(mdxFiles.length)} markdown files...`);

        let count = 0;
        for (const mdxPath of mdxFiles) {
          const relativePath = path.relative(contentDir, mdxPath);
          const outputPath = path.join(staticDir, relativePath.replace(/\.mdx$/, ".md"));

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
