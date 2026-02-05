import fs from "node:fs";
import path from "node:path";

import type { AstroIntegration } from "astro";

const SIZE_THRESHOLD_MB = 4;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_MB * 1024 * 1024;
const SIZE_THRESHOLD_MB_STR = String(SIZE_THRESHOLD_MB);

/**
 * Recursively get all files in a directory with their sizes
 */
function getFilesWithSizes(dir: string, baseDir: string = dir): { path: string; size: number }[] {
  const files: { path: string; size: number }[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getFilesWithSizes(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      files.push({
        path: path.relative(baseDir, fullPath),
        size: stats.size,
      });
    }
  }

  return files;
}

/**
 * Format bytes to human readable string
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Astro integration that checks for large files after build
 * Helps debug Vercel's 5MB serverless function limit
 */
export function fileSizeCheckIntegration(): AstroIntegration {
  return {
    name: "astro-file-size-check",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const outputDir = dir.pathname;

        logger.info(`Checking for files > ${SIZE_THRESHOLD_MB_STR}MB in build output...`);

        // Check the main output directory
        const allFiles = getFilesWithSizes(outputDir);

        // Filter to files larger than threshold
        const largeFiles = allFiles
          .filter((f) => f.size > SIZE_THRESHOLD_BYTES)
          .sort((a, b) => b.size - a.size);

        if (largeFiles.length > 0) {
          logger.warn(
            `Found ${String(largeFiles.length)} file(s) larger than ${SIZE_THRESHOLD_MB_STR}MB:`,
          );
          for (const file of largeFiles) {
            logger.warn(`  ${formatSize(file.size).padStart(10)} - ${file.path}`);
          }
        } else {
          logger.info(`No files larger than ${SIZE_THRESHOLD_MB_STR}MB found in build output.`);
        }

        // Also check .vercel/output if it exists (for Vercel deployments)
        const vercelOutputDir = path.resolve(outputDir, "../.vercel/output");
        if (fs.existsSync(vercelOutputDir)) {
          logger.info(`Checking .vercel/output directory...`);

          const vercelFiles = getFilesWithSizes(vercelOutputDir);
          const largevercelFiles = vercelFiles
            .filter((f) => f.size > SIZE_THRESHOLD_BYTES)
            .sort((a, b) => b.size - a.size);

          if (largevercelFiles.length > 0) {
            logger.warn(
              `Found ${String(largevercelFiles.length)} file(s) larger than ${SIZE_THRESHOLD_MB_STR}MB in .vercel/output:`,
            );
            for (const file of largevercelFiles) {
              logger.warn(`  ${formatSize(file.size).padStart(10)} - ${file.path}`);
            }
          } else {
            logger.info(`No files larger than ${SIZE_THRESHOLD_MB_STR}MB found in .vercel/output.`);
          }

          // Specifically check serverless functions directory
          const functionsDir = path.join(vercelOutputDir, "functions");
          if (fs.existsSync(functionsDir)) {
            logger.info(`Checking serverless functions...`);

            const functionFiles = getFilesWithSizes(functionsDir);
            const largeFunctionFiles = functionFiles
              .filter((f) => f.size > SIZE_THRESHOLD_BYTES)
              .sort((a, b) => b.size - a.size);

            if (largeFunctionFiles.length > 0) {
              logger.error(
                `⚠️  Found ${String(largeFunctionFiles.length)} serverless function file(s) larger than ${SIZE_THRESHOLD_MB_STR}MB:`,
              );
              for (const file of largeFunctionFiles) {
                logger.error(`  ${formatSize(file.size).padStart(10)} - functions/${file.path}`);
              }
              logger.error(
                `These files may exceed Vercel's 5MB limit and cause deployment failures.`,
              );
            } else {
              logger.info(`All serverless function files are under ${SIZE_THRESHOLD_MB_STR}MB.`);
            }
          }
        }

        // Log total build size
        const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
        logger.info(`Total build output size: ${formatSize(totalSize)}`);

        // Log top 10 largest files regardless of threshold
        const top10 = allFiles.sort((a, b) => b.size - a.size).slice(0, 10);
        logger.info(`Top 10 largest files in build output:`);
        for (const file of top10) {
          logger.info(`  ${formatSize(file.size).padStart(10)} - ${file.path}`);
        }
      },
    },
  };
}
