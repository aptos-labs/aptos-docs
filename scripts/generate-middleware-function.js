import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../middleware.js";

// Implement getRegExpFromMatchers since it doesn't exist in @vercel/node
function getRegExpFromMatchers(matchers) {
  if (!Array.isArray(matchers)) {
    return new RegExp(matchers);
  }

  // Convert Next.js/Vercel route patterns to regex patterns
  const regexPatterns = matchers.map((pattern) => {
    let regexPattern = pattern
      // Escape special regex characters except * and :
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
  const combinedPattern = `(${regexPatterns.join("|")})`;
  return new RegExp(combinedPattern);
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

  console.log("Successfully created middleware function for Vercel deployment.");
}

function readJSONSync(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJSONSync(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
