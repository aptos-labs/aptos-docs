import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.join(__dirname, "../src/content/docs");
const SIDEBAR_FILE = path.join(__dirname, "../astro.sidebar.ts");

// Recursively get all .mdx/.md files (excluding zh/, 404, index, README)
function getDocFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "zh") {
        results = results.concat(getDocFiles(filePath));
      }
    } else if (
      (file.endsWith(".mdx") || file.endsWith(".md")) &&
      !file.match(/^(404|index|README)\.mdx?$/)
    ) {
      results.push(filePath);
    }
  }
  return results;
}

// Extract all sidebar paths (strings and link properties) using regex
function extractSidebarPathsFromSource(source: string): string[] {
  const paths = new Set<string>();
  const stringPathRegex = /["'`]([a-zA-Z0-9_\-\/]+\/[^\s"'`]+)["'`]/g;
  let match;
  while ((match = stringPathRegex.exec(source))) {
    paths.add(match[1]);
  }
  const linkPathRegex = /link:\s*["'`]\/?([^"'`]+)["'`]/g;
  while ((match = linkPathRegex.exec(source))) {
    paths.add(match[1]);
  }
  return Array.from(paths);
}

function main() {
  // Get all doc files with relative path from DOCS_DIR
  const docFiles = getDocFiles(DOCS_DIR).map((f) => path.relative(DOCS_DIR, f).replace(/\\/g, "/"));
  const sidebarSrc = fs.readFileSync(SIDEBAR_FILE, "utf8");
  const sidebarPaths = extractSidebarPathsFromSource(sidebarSrc);

  // For each sidebar path, check for .mdx or .md file
  const sidebarFiles = sidebarPaths.flatMap((p) => [p + ".mdx", p + ".md"]);

  // Find doc files that are not referenced in sidebarFiles
  const missing = docFiles.filter((f) => !sidebarFiles.includes(f));
  if (missing.length === 0) {
    console.log("All documentation files are referenced in the sidebar!");
  } else {
    console.log("Missing from sidebar:");
    missing.forEach((f) => console.log(path.join(DOCS_DIR, f)));
  }
}

main();
