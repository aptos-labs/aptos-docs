import fs from "node:fs";
import path from "node:path";

import type { AstroIntegration } from "astro";

/**
 * Astro integration that generates static .md files at build time
 *
 * This creates a .md version of each documentation page that can be
 * served as a static asset, avoiding:
 * - Serverless function size limits (Vercel's 5MB limit)
 * - GitHub raw content rate limiting
 * - External dependencies
 *
 * Usage: Access any doc page's markdown by appending .md to the URL
 * Example: /build/cli -> /build/cli.md
 */
export function markdownFilesIntegration(): AstroIntegration {
  return {
    name: "astro-markdown-files",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const startTime = Date.now();
        const docsDir = path.resolve("src/content/docs");
        const outputDir = dir.pathname;

        logger.info("Generating static .md files...");

        let generated = 0;
        let errors = 0;

        // Recursively process all MDX files
        function processDirectory(srcDir: string, relativePath = ""): void {
          if (!fs.existsSync(srcDir)) {
            return;
          }

          const entries = fs.readdirSync(srcDir, { withFileTypes: true });

          for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
              // Skip disabled directories (like _docs_es_disabled)
              if (entry.name.startsWith("_")) {
                continue;
              }
              processDirectory(srcPath, relPath);
            } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
              try {
                // Read the MDX content
                const content = fs.readFileSync(srcPath, "utf-8");

                // Determine the output path
                // /build/cli.mdx -> /build/cli.md
                const mdFileName = entry.name.replace(/\.mdx$/, ".md");
                const outputPath = path.join(outputDir, relativePath, mdFileName);

                // Ensure the directory exists
                const outputDirPath = path.dirname(outputPath);
                if (!fs.existsSync(outputDirPath)) {
                  fs.mkdirSync(outputDirPath, { recursive: true });
                }

                // Write the content as .md
                fs.writeFileSync(outputPath, content, "utf-8");
                generated++;
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.warn(`Failed to generate ${relPath}: ${message}`);
                errors++;
              }
            }
            // Skip non-MDX files silently
          }
        }

        processDirectory(docsDir);

        const duration = Date.now() - startTime;
        logger.info(`Generated ${String(generated)} .md files in ${String(duration)}ms`);
        if (errors > 0) {
          logger.warn(`${String(errors)} files had errors`);
        }
      },
    },
  };
}
