import path from "node:path";
import fs from "fs/promises";

const POSSIBLE_ASTRO_MIDDLEWARE_PATHS = [
  "src/middleware.ts",
  "src/middleware/index.ts",
  "src/middleware.js",
  "src/middleware/index.js",
];

export async function getAstroMiddlewarePath(projectRootDir: string) {
  for (const possiblePath of POSSIBLE_ASTRO_MIDDLEWARE_PATHS) {
    const fullPath = path.join(projectRootDir, possiblePath);
    const exists = await fs
      .stat(fullPath)
      .then(() => true)
      .catch(() => false);

    if (exists) {
      return possiblePath;
    }
  }

  return null;
}
