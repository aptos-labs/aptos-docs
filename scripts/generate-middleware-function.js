import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../middleware.js";

// Size thresholds
const VERCEL_LIMIT_MB = 5;
const VERCEL_LIMIT_BYTES = VERCEL_LIMIT_MB * 1024 * 1024;
const WARNING_THRESHOLD_MB = 4;
const WARNING_THRESHOLD_BYTES = WARNING_THRESHOLD_MB * 1024 * 1024;

// Implement getRegExpFromMatchers based on Vercel middleware patterns
function getRegExpFromMatchers(matchers) {
  if (!matchers) {
    return "^/.*$";
  }

  const matcherArray = Array.isArray(matchers) ? matchers : [matchers];

  const regexPatterns = matcherArray.map((matcher) => {
    if (typeof matcher !== "string") {
      throw new Error(
        "Middleware's `config.matcher` must be a path matcher (string) or an array of path matchers (string[])",
      );
    }

    if (!matcher.startsWith("/")) {
      throw new Error(
        `Middleware's \`config.matcher\` values must start with "/". Received: ${matcher}`,
      );
    }

    // Convert Next.js route patterns to regex
    let regexPattern = matcher
      // Escape special regex characters
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      // Convert :path* to match any path segments
      .replace(/:path\*/g, ".*")
      // Convert other :param patterns to match single segments
      .replace(/:[^/*]+/g, "[^/]*")
      // Ensure exact match
      .replace(/^/, "^")
      .replace(/$/, "$");

    return regexPattern;
  });

  // Join all patterns with OR operator
  return regexPatterns.join("|");
}

/**
 * Format bytes to human readable string
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Recursively get all files in a directory with their sizes
 */
function getFilesWithSizes(dir, baseDir = dir) {
  const files = [];

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
 * Get directory stats
 */
function getDirectoryStats(dir) {
  const files = getFilesWithSizes(dir);
  return {
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    fileCount: files.length,
    files,
  };
}

/**
 * Group files by extension
 */
function groupByExtension(files) {
  const groups = new Map();

  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase() || "(no extension)";
    const existing = groups.get(ext) || { count: 0, totalSize: 0 };
    groups.set(ext, {
      count: existing.count + 1,
      totalSize: existing.totalSize + file.size,
    });
  }

  return groups;
}

/**
 * Print detailed size analysis before deployment
 */
function printSizeAnalysis(outputDir) {
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║     PRE-DEPLOYMENT SIZE ANALYSIS (Before Vercel Deploy)       ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");

  // Environment info
  console.log("📋 ENVIRONMENT");
  console.log("─".repeat(65));
  console.log(`  VERCEL_ENV:       ${process.env.VERCEL_ENV || "(not set)"}`);
  console.log(`  NODE_ENV:         ${process.env.NODE_ENV || "(not set)"}`);
  console.log(`  VERCEL:           ${process.env.VERCEL || "(not set)"}`);
  console.log("");

  // Check if output directory exists
  if (!fs.existsSync(outputDir)) {
    console.log("⚠️  Vercel output directory not found:", outputDir);
    return;
  }

  // Total output size
  const totalStats = getDirectoryStats(outputDir);
  console.log("📦 TOTAL VERCEL OUTPUT (.vercel/output)");
  console.log("─".repeat(65));
  console.log(`  Total size:       ${formatSize(totalStats.totalSize)}`);
  console.log(`  Total files:      ${totalStats.fileCount}`);
  console.log("");

  // Analyze each top-level directory
  const subdirs = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  console.log("📁 DIRECTORY BREAKDOWN");
  console.log("─".repeat(65));
  for (const subdir of subdirs) {
    const subdirPath = path.join(outputDir, subdir);
    const subdirStats = getDirectoryStats(subdirPath);
    console.log(
      `  ${subdir.padEnd(20)} ${String(subdirStats.fileCount).padStart(6)} files  ${formatSize(subdirStats.totalSize).padStart(12)}`,
    );
  }
  console.log("");

  // CRITICAL: Serverless functions analysis
  const functionsDir = path.join(outputDir, "functions");
  if (fs.existsSync(functionsDir)) {
    console.log("⚡ SERVERLESS FUNCTIONS (Vercel 5MB limit per function)");
    console.log("─".repeat(65));
    console.log(`  ⚠️  Vercel limit: ${VERCEL_LIMIT_MB}MB per function bundle`);
    console.log("");

    // Get all .func directories
    const funcFolders = fs
      .readdirSync(functionsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    let hasProblems = false;

    for (const funcFolder of funcFolders) {
      const funcPath = path.join(functionsDir, funcFolder.name);
      const funcStats = getDirectoryStats(funcPath);

      // Determine status
      let status, statusIcon;
      if (funcStats.totalSize > VERCEL_LIMIT_BYTES) {
        status = "❌ EXCEEDS 5MB LIMIT";
        statusIcon = "❌";
        hasProblems = true;
      } else if (funcStats.totalSize > WARNING_THRESHOLD_BYTES) {
        status = "⚠️  WARNING (>4MB)";
        statusIcon = "⚠️";
        hasProblems = true;
      } else {
        status = "✅ OK";
        statusIcon = "✅";
      }

      console.log(
        `  ${statusIcon} ${funcFolder.name.padEnd(35)} ${formatSize(funcStats.totalSize).padStart(12)} (${funcStats.fileCount} files)`,
      );
      console.log(`     Status: ${status}`);

      // For problematic functions, show detailed breakdown
      if (funcStats.totalSize > WARNING_THRESHOLD_BYTES) {
        console.log("");
        console.log("     📊 File type breakdown:");
        const extGroups = groupByExtension(funcStats.files);
        const sortedExts = Array.from(extGroups.entries()).sort(
          (a, b) => b[1].totalSize - a[1].totalSize,
        );
        for (const [ext, stats] of sortedExts.slice(0, 8)) {
          console.log(
            `        ${ext.padEnd(15)} ${String(stats.count).padStart(5)} files  ${formatSize(stats.totalSize).padStart(12)}`,
          );
        }

        console.log("");
        console.log("     📄 Largest files in this function:");
        const largestFiles = funcStats.files.sort((a, b) => b.size - a.size).slice(0, 10);
        for (const file of largestFiles) {
          const sizeStr = formatSize(file.size).padStart(12);
          const warning = file.size > 1024 * 1024 ? " ⚠️" : "";
          console.log(`        ${sizeStr} - ${file.path}${warning}`);
        }
        console.log("");
      }
    }

    // Also check for nested function directories (e.g., functions/api/...)
    const nestedDirs = fs
      .readdirSync(functionsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.endsWith(".func"));

    for (const nestedDir of nestedDirs) {
      const nestedPath = path.join(functionsDir, nestedDir.name);
      const nestedFuncs = fs
        .readdirSync(nestedPath, { withFileTypes: true })
        .filter((e) => e.isDirectory());

      for (const func of nestedFuncs) {
        const funcPath = path.join(nestedPath, func.name);
        const funcStats = getDirectoryStats(funcPath);
        const funcName = `${nestedDir.name}/${func.name}`;

        let status, statusIcon;
        if (funcStats.totalSize > VERCEL_LIMIT_BYTES) {
          status = "❌ EXCEEDS 5MB LIMIT";
          statusIcon = "❌";
          hasProblems = true;
        } else if (funcStats.totalSize > WARNING_THRESHOLD_BYTES) {
          status = "⚠️  WARNING (>4MB)";
          statusIcon = "⚠️";
          hasProblems = true;
        } else {
          status = "✅ OK";
          statusIcon = "✅";
        }

        console.log(
          `  ${statusIcon} ${funcName.padEnd(35)} ${formatSize(funcStats.totalSize).padStart(12)} (${funcStats.fileCount} files)`,
        );
        console.log(`     Status: ${status}`);

        if (funcStats.totalSize > WARNING_THRESHOLD_BYTES) {
          console.log("");
          console.log("     📄 Largest files:");
          const largestFiles = funcStats.files.sort((a, b) => b.size - a.size).slice(0, 5);
          for (const file of largestFiles) {
            console.log(`        ${formatSize(file.size).padStart(12)} - ${file.path}`);
          }
          console.log("");
        }
      }
    }

    if (hasProblems) {
      console.log("");
      console.log("🚨 WARNING: One or more functions may exceed Vercel's 5MB limit!");
      console.log("   This will cause 'Body exceeded 5mb limit' error during deployment.");
      console.log("");
      console.log("   Possible solutions:");
      console.log("   - Move large static content to external hosting (e.g., GitHub raw)");
      console.log("   - Use redirects instead of serving content directly");
      console.log("   - Split large functions into smaller ones");
      console.log("   - Remove unused dependencies from function bundles");
    }

    console.log("");
  }

  // Static files analysis
  const staticDir = path.join(outputDir, "static");
  if (fs.existsSync(staticDir)) {
    console.log("🗂️  STATIC FILES ANALYSIS");
    console.log("─".repeat(65));

    const staticStats = getDirectoryStats(staticDir);
    console.log(`  Total static size: ${formatSize(staticStats.totalSize)}`);
    console.log(`  Total files:       ${staticStats.fileCount}`);

    // Group by extension
    const extGroups = groupByExtension(staticStats.files);
    const sortedExts = Array.from(extGroups.entries()).sort(
      (a, b) => b[1].totalSize - a[1].totalSize,
    );

    console.log("");
    console.log("  By file type:");
    for (const [ext, stats] of sortedExts.slice(0, 10)) {
      console.log(
        `    ${ext.padEnd(12)} ${String(stats.count).padStart(6)} files  ${formatSize(stats.totalSize).padStart(12)}`,
      );
    }

    // Top 10 largest static files
    console.log("");
    console.log("  Top 10 largest static files:");
    const largestStatic = staticStats.files.sort((a, b) => b.size - a.size).slice(0, 10);
    for (const file of largestStatic) {
      console.log(`    ${formatSize(file.size).padStart(12)} - ${file.path}`);
    }
    console.log("");
  }

  // Check config.json for route count
  const configPath = path.join(outputDir, "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.routes) {
        console.log("⚙️  VERCEL CONFIG");
        console.log("─".repeat(65));
        console.log(`  Total routes:      ${config.routes.length}`);

        const middlewareRoutes = config.routes.filter((r) => r.middlewarePath);
        const staticRoutes = config.routes.filter((r) => r.src && !r.middlewarePath && !r.dest);
        const rewriteRoutes = config.routes.filter((r) => r.dest);

        console.log(`  Middleware routes: ${middlewareRoutes.length}`);
        console.log(`  Static routes:     ${staticRoutes.length}`);
        console.log(`  Rewrite routes:    ${rewriteRoutes.length}`);
        console.log("");
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Summary
  console.log("═".repeat(65));
  console.log("                           SUMMARY");
  console.log("═".repeat(65));
  console.log(`  Total output size:     ${formatSize(totalStats.totalSize)}`);
  console.log(`  Total files:           ${totalStats.fileCount}`);

  if (fs.existsSync(functionsDir)) {
    const funcStats = getDirectoryStats(functionsDir);
    console.log(`  Functions size:        ${formatSize(funcStats.totalSize)}`);
  }

  console.log("");
  console.log("  If you see 'Body exceeded 5mb limit' error after this,");
  console.log("  check the serverless function sizes above.");
  console.log("═".repeat(65));
  console.log("");
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.resolve(rootDir, ".vercel/output");

main();

function main() {
  const middlewareFuncDir = path.join(outputDir, "functions/middleware.func");

  if (!fs.existsSync(middlewareFuncDir)) {
    fs.mkdirSync(middlewareFuncDir, { recursive: true });
  }

  fs.copyFileSync(
    path.join(rootDir, "middleware.js"),
    path.join(middlewareFuncDir, "middleware.js"),
  );
  fs.copyFileSync(path.join(rootDir, "package.json"), path.join(middlewareFuncDir, "package.json"));
  writeJSONSync(path.join(middlewareFuncDir, ".vc-config.json"), {
    runtime: "edge",
    deploymentTarget: "v8-worker",
    entrypoint: "middleware.js",
  });

  const outputConfigPath = path.join(outputDir, "config.json");
  if (fs.existsSync(outputConfigPath)) {
    const outputConfig = readJSONSync(outputConfigPath);
    outputConfig.routes.splice(1, 0, {
      src: getRegExpFromMatchers(config.matcher),
      middlewareRawSrc: config.matcher,
      middlewarePath: "middleware",
      continue: true,
      override: true,
    });
    writeJSONSync(outputConfigPath, outputConfig);
  }

  // Print detailed size analysis BEFORE the success message
  printSizeAnalysis(outputDir);

  console.log("Successfully created middleware function for Vercel deployment.");
}

function readJSONSync(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSONSync(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
