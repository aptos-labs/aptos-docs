import fs from "node:fs";
import path from "node:path";

import type { AstroIntegration } from "astro";

const SIZE_THRESHOLD_MB = 4;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_MB * 1024 * 1024;
const SIZE_THRESHOLD_MB_STR = String(SIZE_THRESHOLD_MB);
const VERCEL_LIMIT_MB = 5;
const VERCEL_LIMIT_BYTES = VERCEL_LIMIT_MB * 1024 * 1024;

interface FileInfo {
  path: string;
  size: number;
}

interface DirectoryStats {
  totalSize: number;
  fileCount: number;
  files: FileInfo[];
}

/**
 * Recursively get all files in a directory with their sizes
 */
function getFilesWithSizes(dir: string, baseDir: string = dir): FileInfo[] {
  const files: FileInfo[] = [];

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
 * Get directory stats (total size and file count)
 */
function getDirectoryStats(dir: string): DirectoryStats {
  const files = getFilesWithSizes(dir);
  return {
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    fileCount: files.length,
    files,
  };
}

/**
 * Get immediate subdirectories of a directory
 */
function getSubdirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Format bytes to human readable string
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Group files by extension
 */
function groupByExtension(files: FileInfo[]): Map<string, { count: number; totalSize: number }> {
  const groups = new Map<string, { count: number; totalSize: number }>();

  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase() || "(no extension)";
    const existing = groups.get(ext) ?? { count: 0, totalSize: 0 };
    groups.set(ext, {
      count: existing.count + 1,
      totalSize: existing.totalSize + file.size,
    });
  }

  return groups;
}

/**
 * Group files by top-level directory
 */
function groupByTopDirectory(files: FileInfo[]): Map<string, { count: number; totalSize: number }> {
  const groups = new Map<string, { count: number; totalSize: number }>();

  for (const file of files) {
    const topDir = file.path.split(path.sep)[0] ?? "(root)";
    const existing = groups.get(topDir) ?? { count: 0, totalSize: 0 };
    groups.set(topDir, {
      count: existing.count + 1,
      totalSize: existing.totalSize + file.size,
    });
  }

  return groups;
}

/**
 * Astro integration that provides detailed build size analysis
 * Helps debug Vercel's 5MB serverless function limit
 */
export function fileSizeCheckIntegration(): AstroIntegration {
  return {
    name: "astro-file-size-check",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const outputDir = dir.pathname;
        const vercelOutputDir = path.resolve(outputDir, "../.vercel/output");

        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("                    BUILD SIZE ANALYSIS REPORT                  ");
        logger.info("═══════════════════════════════════════════════════════════════");

        // Environment Info
        logger.info("");
        logger.info("📋 ENVIRONMENT INFO");
        logger.info("───────────────────────────────────────────────────────────────");
        logger.info(`  VERCEL_ENV:          ${process.env.VERCEL_ENV ?? "(not set)"}`);
        logger.info(`  NODE_ENV:            ${process.env.NODE_ENV ?? "(not set)"}`);
        logger.info(`  VERCEL:              ${process.env.VERCEL ?? "(not set)"}`);
        logger.info(`  GITHUB_ACTIONS:      ${process.env.GITHUB_ACTIONS ?? "(not set)"}`);
        logger.info(`  Build output dir:    ${outputDir}`);

        // Main Build Output Analysis
        logger.info("");
        logger.info("📦 MAIN BUILD OUTPUT (.vercel/output/static or dist)");
        logger.info("───────────────────────────────────────────────────────────────");

        const mainStats = getDirectoryStats(outputDir);
        logger.info(`  Total size:          ${formatSize(mainStats.totalSize)}`);
        logger.info(`  Total files:         ${String(mainStats.fileCount)}`);

        // Group by extension
        const extGroups = groupByExtension(mainStats.files);
        const sortedExts = Array.from(extGroups.entries()).sort(
          (a, b) => b[1].totalSize - a[1].totalSize,
        );

        logger.info("");
        logger.info("  📊 By file type:");
        for (const [ext, stats] of sortedExts.slice(0, 15)) {
          logger.info(
            `     ${ext.padEnd(15)} ${String(stats.count).padStart(6)} files  ${formatSize(stats.totalSize).padStart(12)}`,
          );
        }
        if (sortedExts.length > 15) {
          logger.info(`     ... and ${String(sortedExts.length - 15)} more types`);
        }

        // Group by top directory
        const dirGroups = groupByTopDirectory(mainStats.files);
        const sortedDirs = Array.from(dirGroups.entries()).sort(
          (a, b) => b[1].totalSize - a[1].totalSize,
        );

        logger.info("");
        logger.info("  📁 By directory:");
        for (const [dirName, stats] of sortedDirs.slice(0, 10)) {
          logger.info(
            `     ${dirName.padEnd(20)} ${String(stats.count).padStart(6)} files  ${formatSize(stats.totalSize).padStart(12)}`,
          );
        }

        // Vercel Output Analysis
        if (fs.existsSync(vercelOutputDir)) {
          logger.info("");
          logger.info("🔷 VERCEL OUTPUT ANALYSIS (.vercel/output)");
          logger.info("───────────────────────────────────────────────────────────────");

          const vercelStats = getDirectoryStats(vercelOutputDir);
          logger.info(`  Total size:          ${formatSize(vercelStats.totalSize)}`);
          logger.info(`  Total files:         ${String(vercelStats.fileCount)}`);

          // Analyze each top-level directory in .vercel/output
          const vercelSubdirs = getSubdirectories(vercelOutputDir);
          logger.info("");
          logger.info("  📁 Directory breakdown:");
          for (const subdir of vercelSubdirs) {
            const subdirPath = path.join(vercelOutputDir, subdir);
            const subdirStats = getDirectoryStats(subdirPath);
            logger.info(
              `     ${subdir.padEnd(20)} ${String(subdirStats.fileCount).padStart(6)} files  ${formatSize(subdirStats.totalSize).padStart(12)}`,
            );
          }

          // DETAILED SERVERLESS FUNCTIONS ANALYSIS
          const functionsDir = path.join(vercelOutputDir, "functions");
          if (fs.existsSync(functionsDir)) {
            logger.info("");
            logger.info("⚡ SERVERLESS FUNCTIONS (Critical for Vercel 5MB limit)");
            logger.info("───────────────────────────────────────────────────────────────");
            logger.info(`  Vercel limit:        ${String(VERCEL_LIMIT_MB)}MB per function`);
            logger.info(`  Warning threshold:   ${SIZE_THRESHOLD_MB_STR}MB`);
            logger.info("");

            // Get all function directories (*.func folders)
            const functionFolders = fs
              .readdirSync(functionsDir, { withFileTypes: true })
              .filter((entry) => entry.isDirectory() && entry.name.endsWith(".func"));

            if (functionFolders.length === 0) {
              logger.info("  No serverless functions found (.func directories)");
            } else {
              logger.info(`  Found ${String(functionFolders.length)} serverless function(s):`);
              logger.info("");

              let hasLargeFunction = false;

              for (const funcFolder of functionFolders) {
                const funcPath = path.join(functionsDir, funcFolder.name);
                const funcStats = getDirectoryStats(funcPath);
                const funcName = funcFolder.name.replace(".func", "");

                // Determine status
                let status = "✅";
                let statusText = "OK";
                if (funcStats.totalSize > VERCEL_LIMIT_BYTES) {
                  status = "❌";
                  statusText = "EXCEEDS LIMIT";
                  hasLargeFunction = true;
                } else if (funcStats.totalSize > SIZE_THRESHOLD_BYTES) {
                  status = "⚠️";
                  statusText = "WARNING";
                  hasLargeFunction = true;
                }

                logger.info(
                  `  ${status} ${funcName.padEnd(30)} ${formatSize(funcStats.totalSize).padStart(12)} (${String(funcStats.fileCount)} files) ${statusText}`,
                );

                // Show breakdown for large functions
                if (funcStats.totalSize > SIZE_THRESHOLD_BYTES) {
                  const funcExtGroups = groupByExtension(funcStats.files);
                  const sortedFuncExts = Array.from(funcExtGroups.entries()).sort(
                    (a, b) => b[1].totalSize - a[1].totalSize,
                  );

                  logger.info("     └─ Breakdown by type:");
                  for (const [ext, stats] of sortedFuncExts.slice(0, 5)) {
                    logger.info(
                      `        ${ext.padEnd(12)} ${String(stats.count).padStart(4)} files  ${formatSize(stats.totalSize).padStart(10)}`,
                    );
                  }

                  // Show largest files in this function
                  const largestInFunc = funcStats.files.sort((a, b) => b.size - a.size).slice(0, 5);
                  logger.info("     └─ Largest files:");
                  for (const file of largestInFunc) {
                    logger.info(`        ${formatSize(file.size).padStart(10)} - ${file.path}`);
                  }
                  logger.info("");
                }
              }

              if (hasLargeFunction) {
                logger.error("");
                logger.error(
                  "  ⚠️  WARNING: One or more functions are approaching or exceeding the 5MB limit!",
                );
                logger.error(
                  "  Consider: chunking content, using external hosting, or reducing bundle size.",
                );
              }
            }

            // Also check for non-.func items in functions directory
            const otherItems = fs
              .readdirSync(functionsDir, { withFileTypes: true })
              .filter((entry) => !entry.name.endsWith(".func"));

            if (otherItems.length > 0) {
              logger.info("");
              logger.info("  Other items in functions directory:");
              for (const item of otherItems) {
                const itemPath = path.join(functionsDir, item.name);
                if (item.isDirectory()) {
                  const itemStats = getDirectoryStats(itemPath);
                  logger.info(
                    `     📁 ${item.name.padEnd(25)} ${formatSize(itemStats.totalSize).padStart(12)}`,
                  );
                } else {
                  const itemStats = fs.statSync(itemPath);
                  logger.info(
                    `     📄 ${item.name.padEnd(25)} ${formatSize(itemStats.size).padStart(12)}`,
                  );
                }
              }
            }
          }

          // Check for config.json
          const configPath = path.join(vercelOutputDir, "config.json");
          if (fs.existsSync(configPath)) {
            logger.info("");
            logger.info("⚙️  VERCEL CONFIG (config.json)");
            logger.info("───────────────────────────────────────────────────────────────");
            try {
              const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as {
                routes?: {
                  src?: string;
                  dest?: string;
                  middlewarePath?: string;
                  status?: number;
                }[];
              };
              if (config.routes) {
                const middlewareRoutes = config.routes.filter(
                  (r: { middlewarePath?: string }) => r.middlewarePath,
                );
                const redirectRoutes = config.routes.filter(
                  (r: { status?: number }) => r.status && r.status >= 300 && r.status < 400,
                );
                const rewriteRoutes = config.routes.filter(
                  (r: { dest?: string; status?: number }) => r.dest && !r.status,
                );

                logger.info(`  Total routes:        ${String(config.routes.length)}`);
                logger.info(`  Middleware routes:   ${String(middlewareRoutes.length)}`);
                logger.info(`  Redirect routes:     ${String(redirectRoutes.length)}`);
                logger.info(`  Rewrite routes:      ${String(rewriteRoutes.length)}`);
              }
            } catch {
              logger.warn("  Could not parse config.json");
            }
          }
        } else {
          logger.info("");
          logger.info("🔷 VERCEL OUTPUT: Not found (not a Vercel build)");
        }

        // Files exceeding threshold
        logger.info("");
        logger.info(`🚨 FILES EXCEEDING ${SIZE_THRESHOLD_MB_STR}MB THRESHOLD`);
        logger.info("───────────────────────────────────────────────────────────────");

        const largeFiles = mainStats.files
          .filter((f) => f.size > SIZE_THRESHOLD_BYTES)
          .sort((a, b) => b.size - a.size);

        if (largeFiles.length > 0) {
          for (const file of largeFiles) {
            logger.warn(`  ${formatSize(file.size).padStart(12)} - ${file.path}`);
          }
        } else {
          logger.info(`  None found in main build output.`);
        }

        // Top 20 largest files
        logger.info("");
        logger.info("📈 TOP 20 LARGEST FILES");
        logger.info("───────────────────────────────────────────────────────────────");

        const top20 = mainStats.files.sort((a, b) => b.size - a.size).slice(0, 20);
        for (const file of top20) {
          logger.info(`  ${formatSize(file.size).padStart(12)} - ${file.path}`);
        }

        // Summary
        logger.info("");
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info("                         SUMMARY                                ");
        logger.info("═══════════════════════════════════════════════════════════════");
        logger.info(
          `  Build output:        ${formatSize(mainStats.totalSize)} (${String(mainStats.fileCount)} files)`,
        );

        if (fs.existsSync(vercelOutputDir)) {
          const vercelStats = getDirectoryStats(vercelOutputDir);
          logger.info(
            `  Vercel output:       ${formatSize(vercelStats.totalSize)} (${String(vercelStats.fileCount)} files)`,
          );

          const functionsDir = path.join(vercelOutputDir, "functions");
          if (fs.existsSync(functionsDir)) {
            const funcStats = getDirectoryStats(functionsDir);
            logger.info(
              `  Functions total:     ${formatSize(funcStats.totalSize)} (${String(funcStats.fileCount)} files)`,
            );
          }
        }

        logger.info(`  Large files (>${SIZE_THRESHOLD_MB_STR}MB): ${String(largeFiles.length)}`);
        logger.info("═══════════════════════════════════════════════════════════════");
      },
    },
  };
}
