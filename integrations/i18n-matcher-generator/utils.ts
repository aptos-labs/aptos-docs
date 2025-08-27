import fs from "node:fs/promises";

/**
 * Function to get directories from a path, excluding language directories
 */
export async function getDirectoriesList(path: string, excludeDirs: string[] = []) {
  return fs
    .readdir(path, { withFileTypes: true })
    .then((dirents) =>
      dirents
        .filter((dirent) => dirent.isDirectory() && !excludeDirs.includes(dirent.name))
        .map((dirent) => dirent.name),
    );
}

export async function isPathExist(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path: string) {
  const stat = await fs.stat(path);

  return stat.isDirectory();
}

export function getGeneratedFileTemplate(allPaths: string[]): string {
  return `// THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Generated on ${new Date().toISOString()}

export const i18MatcherRegexp = new RegExp(\`^(${allPaths.map((p) => p.replace(/:\w+\*/g, "[^/]+")).join("|")})$\`);
`;
}
