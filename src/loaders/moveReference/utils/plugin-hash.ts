import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Generates a hash of all plugin files in the specified directory.
 * This hash will change whenever any plugin file is modified.
 */
export async function getPluginHash(): Promise<string> {
  try {
    // Get all plugin files
    const pluginDir = join(process.cwd(), "src/loaders/moveReference/plugins");
    const files = await readdir(pluginDir);

    // Sort files to ensure consistent hash order
    const sortedFiles = files.sort();

    // Create a hash of all plugin contents combined
    const hash = createHash("md5");

    // Read and hash each file
    for (const file of sortedFiles) {
      const content = await readFile(join(pluginDir, file), "utf8");
      // Add filename to hash to catch renames
      hash.update(file);
      hash.update(content, "utf8");
    }

    return hash.digest("hex");
  } catch (error) {
    console.error("Error generating plugin hash:", error);
    // Return a unique fallback hash to trigger refresh
    return `error-${new Date().toISOString()}`;
  }
}
