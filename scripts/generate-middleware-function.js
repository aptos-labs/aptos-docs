import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../middleware.js";

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
