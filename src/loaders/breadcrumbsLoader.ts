import { getCollection } from "astro:content";
import { SUPPORTED_LANGUAGES } from "~/config/i18n.mjs";

// Define the return type for the path maps
export interface PathMaps {
  pathToTitleMap: Map<string, string>;
  validLandingPaths: Set<string>;
}

// Cache for the path maps
let pathMapsCache: PathMaps | null = null;

/**
 * Build and cache the path maps for breadcrumbs
 * This function will only build the maps once and then cache them
 */
export async function getPathMaps(): Promise<PathMaps> {
  // Return cached data if available
  if (pathMapsCache) {
    return pathMapsCache;
  }

  console.info("Building breadcrumbs path maps...");

  // Create maps for paths to frontmatter data and to track valid landing pages
  const pathToTitleMap = new Map<string, string>();
  const validLandingPaths = new Set<string>();
  const allSlugs = new Set<string>();

  // Fetch all docs
  const allDocs = await getCollection("docs");

  // Process all docs to build the path-to-title map
  for (const doc of allDocs) {
    if (!doc.id) continue;

    // Get the slug (path) from the doc ID
    // Remove the file extension (.md or .mdx)
    const slug = doc.id ? doc.id.replace(/\.(md|mdx)$/, "") : "";
    if (!slug) continue;

    // Store all slugs for later reference
    allSlugs.add(slug);

    // Get title from frontmatter data
    let title = "";
    if (typeof doc.data.title === "string") {
      title = doc.data.title;
    } else if (typeof doc.data.breadcrumbTitle === "string") {
      title = doc.data.breadcrumbTitle;
    }

    // Store the title in the map
    if (title) {
      pathToTitleMap.set(slug, title);

      // Case 1: Handle index files - map 'path/index' to 'path' for directory titles
      if (slug.endsWith("/index")) {
        const dirPath = slug.slice(0, -"/index".length);
        pathToTitleMap.set(dirPath, title);
        validLandingPaths.add(dirPath);
      }

      // Case 2: Handle files with same name as their parent directory
      const lastSlashIndex = slug.lastIndexOf("/");
      if (lastSlashIndex !== -1) {
        const dirName = slug.substring(0, lastSlashIndex);
        const fileName = slug.substring(lastSlashIndex + 1);

        // If the file name matches the last part of the directory path
        const dirNameParts = dirName.split("/");
        const lastDirPart = dirNameParts[dirNameParts.length - 1];

        if (fileName === lastDirPart) {
          validLandingPaths.add(dirName);
        }
      }
    }
  }

  // Case 3: Handle files that have the same name as a subdirectory
  for (const slug of allSlugs) {
    const parts = slug.split("/");
    if (parts.length >= 2) {
      const fileName = parts[parts.length - 1];

      // Reconstruct the potential directory path using parts
      // This avoids the string | undefined type issue
      const dirParts = parts.slice(0, -1);
      const potentialDirPath = [...dirParts, fileName].join("/");

      // If this directory exists (we have files in it)
      for (const otherSlug of allSlugs) {
        if (otherSlug.startsWith(`${potentialDirPath}/`)) {
          // This is a landing page for the directory with the same name
          validLandingPaths.add(potentialDirPath);
          break;
        }
      }
    }
  }

  // Add localized home paths as valid landing pages
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.code !== "en") {
      // 'en' is root, already handled
      validLandingPaths.add(lang.code);
    }
  }

  // Store in cache
  pathMapsCache = { pathToTitleMap, validLandingPaths };
  return pathMapsCache;
}
