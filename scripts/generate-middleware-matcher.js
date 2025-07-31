#!/usr/bin/env node

/**
 * Generate the middleware matcher routes dynamically
 *
 * This script discovers routes from the project and generates
 * the matcher-routes-dynamic.js file for the middleware config.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * Get supported languages by dynamically importing the config file
 */
async function getSupportedLanguages() {
  try {
    // Dynamically import the languages from config file
    const { SUPPORTED_LANGUAGES } = await import("../src/config/18n.js");
    return SUPPORTED_LANGUAGES;
  } catch (error) {
    console.error(
      `Error importing languages: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Fallback only if import fails
    return [{ code: "en", label: "English" }];
  }
}

/**
 * Function to get directories from a path, excluding language directories
 */
function getDirectories(sourcePath, excludeDirs = []) {
  try {
    return fs
      .readdirSync(sourcePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && !excludeDirs.includes(dirent.name))
      .map((dirent) => dirent.name);
  } catch (error) {
    console.warn(
      `Could not read directories from ${sourcePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

/**
 * Main function to generate the middleware matcher
 */
async function generateMatcher() {
  // Get languages dynamically
  const SUPPORTED_LANGUAGES = await getSupportedLanguages();
  console.log("Using languages:", SUPPORTED_LANGUAGES.map((lang) => lang.code).join(", "));

  // Get non-English locale codes
  const NON_ENGLISH_LOCALES = SUPPORTED_LANGUAGES.filter((lang) => lang.code !== "en").map(
    (lang) => lang.code,
  );

  // Discover content paths from src/content/docs
  const contentDocsPath = path.join(rootDir, "src/content/docs");
  const contentDirs = getDirectories(contentDocsPath, NON_ENGLISH_LOCALES);
  const contentPaths = contentDirs.map((dir) => `/${dir}/:path*`);

  // Discover paths from src/pages/[...lang]
  const langPagesPath = path.join(rootDir, "src/pages/[...lang]");
  let pagePaths = [];

  if (fs.existsSync(langPagesPath)) {
    try {
      const pageFiles = fs.readdirSync(langPagesPath, { withFileTypes: true });

      // Get .astro files
      const astroFiles = pageFiles
        .filter((file) => file.isFile() && file.name.endsWith(".astro"))
        .map((file) => `/${file.name.replace(".astro", "")}`);

      // Get directories
      const pageDirectories = pageFiles
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => `/${dirent.name}/:path*`);

      pagePaths = [...astroFiles, ...pageDirectories];
    } catch (error) {
      console.warn(
        `Could not read files from ${langPagesPath}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Check if API reference is enabled from environment variables
  let apiReferencePaths = [];
  try {
    const envPath = path.join(rootDir, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      if (envContent.includes("ENABLE_API_REFERENCE=true")) {
        apiReferencePaths.push("/api-reference/:path*");
      }
    }
  } catch (error) {
    console.warn(
      "Could not check for API reference configuration:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Load manual routes if available
  let manualRoutes = [];
  try {
    const manualRoutesPath = path.join(rootDir, "src/middlewares/matcher-routes-manual.js");
    if (fs.existsSync(manualRoutesPath)) {
      const module = await import(manualRoutesPath);
      manualRoutes = Array.isArray(module.routes) ? module.routes : [];
    }
  } catch (error) {
    console.warn(
      "Could not load manual routes:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Load redirect routes if available
  let redirectRoutes = [];
  try {
    const redirectRoutesPath = path.join(rootDir, "src/middlewares/redirects.ts");
    if (fs.existsSync(redirectRoutesPath)) {
      const redirectContent = fs.readFileSync(redirectRoutesPath, "utf8");
      const redirectRoutesMatch = redirectContent.match(
        /redirectRoutes:\s*string\[\]\s*=\s*\[([\s\S]*?)\]/,
      );
      if (redirectRoutesMatch) {
        const routesContent = redirectRoutesMatch[1];
        const routeMatches = routesContent.match(/"([^"]+)"/g);
        if (routeMatches) {
          redirectRoutes = routeMatches.map((route) => route.replace(/"/g, ""));
        }
      }
    }
  } catch (error) {
    console.warn(
      "Could not load redirect routes:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Combine all content paths
  const ALL_CONTENT_PATHS = [
    "/",
    ...contentPaths,
    ...pagePaths,
    ...apiReferencePaths,
    ...manualRoutes,
    ...redirectRoutes,
  ];

  // Generate language-specific paths
  const LANGUAGE_PATHS = [];
  NON_ENGLISH_LOCALES.forEach((code) => {
    // Add the base language path with exact matching to avoid matching _astro paths
    LANGUAGE_PATHS.push(`/${code}$`);

    // Add localized versions of all content paths (except the root path)
    ALL_CONTENT_PATHS.forEach((contentPath) => {
      // Skip the root path as we already have /{code}
      if (contentPath !== "/") {
        LANGUAGE_PATHS.push(`/${code}${contentPath}`);
      }
    });
  });

  // Combine all paths
  const ALL_PATHS = [...ALL_CONTENT_PATHS, ...LANGUAGE_PATHS];

  // Generate the middleware matcher file content
  const matcherContent = `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Generated on ${new Date().toISOString()}

export const matcher = ${JSON.stringify(ALL_PATHS, null, 2)};
`;

  // Write the file
  const outputPath = path.join(rootDir, "src/middlewares/matcher-routes-dynamic.js");
  fs.writeFileSync(outputPath, matcherContent);
  console.log("Middleware matcher file generated successfully!");
}

// Execute the main function
generateMatcher().catch((error) => {
  console.error("Error generating middleware matcher:", error);
  process.exit(1);
});
