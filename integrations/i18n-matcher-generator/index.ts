import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import type { AstroConfig, AstroIntegration } from "astro";
import { getDirectoriesList, getGeneratedFileTemplate, isDirectory, isPathExist } from "./utils";

interface SupportedLanguage {
  code: string;
  label: string;
  default?: boolean;
}

/**
 * Manual routes for middleware configuration
 * Add any custom routes here that aren't automatically detected
 *
 * Examples: '/custom-page/:path*', '/api/:path*',
 */
type ManualRouteMatcher = string;

interface i18nMatcherGeneratorOptions {
  supportedLanguages: SupportedLanguage[];
  manualMatchers?: ManualRouteMatcher[];
}

export default function i18nMatcherGenerator({
  supportedLanguages,
  manualMatchers,
}: i18nMatcherGeneratorOptions) {
  let astroConfig: AstroConfig;

  const integration: AstroIntegration = {
    name: "i18n-matcher-generator",
    hooks: {
      "astro:config:setup": ({ config }) => {
        astroConfig = config;
      },
      "astro:routes:resolved": async ({ logger }) => {
        const rootDir = fileURLToPath(astroConfig.root);

        // Get non-English locale codes
        const NON_ENGLISH_LOCALES = supportedLanguages
          .filter((lang) => lang.code !== "en")
          .map((lang) => lang.code);

        // Discover content paths from src/content/docs
        const contentDocsPath = path.join(rootDir, "src/content/docs");
        const contentDirs = await getDirectoriesList(contentDocsPath, NON_ENGLISH_LOCALES).catch(
          (error: unknown) => {
            console.warn(`Could not read directories from ${contentDocsPath}: ${String(error)}`);

            return [];
          },
        );
        const contentPaths = contentDirs.map((dir) => `/${dir}/:path*`);
        // Discover paths from src/pages/[...lang]
        const langPagesPath = path.join(rootDir, "src/pages/[...lang]");
        let pagePaths: string[] = [];

        if (await isDirectory(langPagesPath)) {
          try {
            const pageFiles = await fs.readdir(langPagesPath, { withFileTypes: true });

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
            logger.warn(`Could not read files from ${langPagesPath}: ${String(error)}`);
          }
        }

        // Check if API reference is enabled from environment variables
        const apiReferencePaths = [];
        try {
          const envPath = path.join(rootDir, ".env");
          if (await isPathExist(envPath)) {
            const envContent = await fs.readFile(envPath, "utf8");
            if (envContent.includes("ENABLE_API_REFERENCE=true")) {
              apiReferencePaths.push("/api-reference/:path*");
            }
          }
        } catch (error) {
          logger.warn(`Could not check for API reference configuration: ${String(error)}`);
        }

        // Combine all content paths
        const ALL_CONTENT_PATHS = [
          "/",
          ...contentPaths,
          ...pagePaths,
          ...apiReferencePaths,
          ...(manualMatchers ?? []),
        ];

        // Generate language-specific paths
        const LANGUAGE_PATHS: string[] = [];
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

        // Write the file
        const outputPath = path.join(rootDir, "src/middlewares/matcher-routes-dynamic.js");
        await fs.writeFile(outputPath, getGeneratedFileTemplate(ALL_PATHS));
        logger.info("Middleware matcher file generated successfully!");
      },
    },
  };

  return integration;
}
