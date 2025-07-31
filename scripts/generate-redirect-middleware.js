#!/usr/bin/env node

/**
 * Generate redirect middleware from astro.config.mjs redirects
 *
 * This script extracts redirects from the Astro config and generates
 * a TypeScript middleware file for server-side redirects.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Get the directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Import the language configuration
const { SUPPORTED_LANGUAGES } = await import("../src/config/18n.js");

/**
 * Extract redirects from src/config/redirects.json
 */
async function extractRedirects() {
  try {
    const configPath = path.join(rootDir, "src/config/redirects.json");
    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);

    const allRedirects = [];
    let baseRedirectCount = 0;
    let languageRedirectCount = 0;

    // Process all redirects
    if (config.redirects && Array.isArray(config.redirects)) {
      for (const redirect of config.redirects) {
        if (redirect.applyToAllLangs) {
          // Generate redirects for all languages
          for (const lang of SUPPORTED_LANGUAGES) {
            if (lang.code === "en") {
              // English uses root path (no language prefix)
              allRedirects.push({
                from: redirect.from,
                to: redirect.to,
                status: redirect.status || 301,
                description: redirect.description ? `${redirect.description} (en)` : undefined,
              });
            } else {
              // Other languages use language prefix
              allRedirects.push({
                from: `/${lang.code}${redirect.from}`,
                to: `/${lang.code}${redirect.to}`,
                status: redirect.status || 301,
                description: redirect.description
                  ? `${redirect.description} (${lang.code})`
                  : undefined,
              });
            }
          }
          languageRedirectCount++;
        } else if (redirect.langs && Array.isArray(redirect.langs)) {
          // Generate redirects for specific languages
          for (const langCode of redirect.langs) {
            if (langCode === "en") {
              // English uses root path (no language prefix)
              allRedirects.push({
                from: redirect.from,
                to: redirect.to,
                status: redirect.status || 301,
                description: redirect.description ? `${redirect.description} (en)` : undefined,
              });
            } else {
              // Other languages use language prefix
              allRedirects.push({
                from: `/${langCode}${redirect.from}`,
                to: `/${langCode}${redirect.to}`,
                status: redirect.status || 301,
                description: redirect.description
                  ? `${redirect.description} (${langCode})`
                  : undefined,
              });
            }
          }
          languageRedirectCount++;
        } else {
          // Regular redirect (no language expansion)
          allRedirects.push({
            from: redirect.from,
            to: redirect.to,
            status: redirect.status || 301,
            description: redirect.description,
          });
          baseRedirectCount++;
        }
      }
    }

    // Convert to object format for compatibility
    const redirectsObj = {};
    allRedirects.forEach((redirect) => {
      redirectsObj[redirect.from] = redirect;
    });

    console.log(`Found ${allRedirects.length} redirects in src/config/redirects.json`);
    console.log(`  - Base redirects: ${baseRedirectCount}`);
    console.log(
      `  - Language redirects: ${languageRedirectCount} (expanded to ${allRedirects.length - baseRedirectCount})`,
    );

    return redirectsObj;
  } catch (error) {
    console.error(
      `Error reading redirects config: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error("Falling back to empty redirects");
    return {};
  }
}

/**
 * Generate TypeScript middleware content
 */
function generateMiddlewareContent(redirects) {
  const redirectEntries = Object.entries(redirects);

  if (redirectEntries.length === 0) {
    return `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Generated on ${new Date().toISOString()}

/**
 * Redirect middleware - handles server-side redirects
 * No redirects configured
 */
export default function redirectMiddleware(req: Request): Response | undefined {
  // No redirects configured
  return undefined;
}

export const redirectRoutes: string[] = [];
`;
  }

  // Generate redirect logic
  const redirectCases = redirectEntries
    .map(([from, redirectConfig]) => {
      const destination = redirectConfig.to;
      const status = redirectConfig.status || 301;

      return `  if (pathname === "${from}") {
    return Response.redirect(new URL("${destination}", req.url), ${status});
  }`;
    })
    .join("\n");

  // Generate route list for matcher
  const routeList = redirectEntries.map(([from]) => `"${from}"`).join(",\n    ");

  return `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Generated on ${new Date().toISOString()}

/**
 * Redirect middleware - handles server-side redirects
 * Extracted from astro.config.mjs redirects configuration
 */
export default function redirectMiddleware(req: Request): Response | undefined {
  const url = new URL(req.url);
  const pathname = url.pathname;

${redirectCases}

  // No redirect found
  return undefined;
}

/**
 * List of redirect routes for middleware matcher
 */
export const redirectRoutes: string[] = [
    ${routeList}
];
`;
}

/**
 * Main function to generate the redirect middleware
 */
async function generateRedirectMiddleware() {
  console.log("Generating redirect middleware...");

  // Extract redirects from config
  const redirects = await extractRedirects();

  // Generate middleware content
  const middlewareContent = generateMiddlewareContent(redirects);

  // Ensure middlewares directory exists
  const middlewaresDir = path.join(rootDir, "src/middlewares");
  if (!fs.existsSync(middlewaresDir)) {
    fs.mkdirSync(middlewaresDir, { recursive: true });
  }

  // Write the middleware file
  const outputPath = path.join(middlewaresDir, "redirects.ts");
  fs.writeFileSync(outputPath, middlewareContent);

  console.log(`Redirect middleware generated successfully at ${outputPath}`);
  console.log(`Generated ${Object.keys(redirects).length} redirect rules`);
}

// Execute the main function
generateRedirectMiddleware().catch((error) => {
  console.error("Error generating redirect middleware:", error);
  process.exit(1);
});
