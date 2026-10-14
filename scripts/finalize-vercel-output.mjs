#!/usr/bin/env node
/**
 * Make `.vercel/output` match the Build Output API v3 surface that Vercel
 * uploads: `config.json`, `static/`, and `functions/`.
 *
 * `@astrojs/vercel` 11.0.8+ copies the server build to `_functions/` when
 * `preserveBuildServerDir` is on, and Astro writes Monaco workers to `client/`
 * when `build.server` lives under `.vercel/output`. Neither directory is part
 * of the Build Output API. Preview deploys of Astro 7.2.6+ still failed after
 * CSP was collapsed; leftover dirs were one of the remaining mismatches.
 * Merge `client/` into `static/` so `/monaco` workers are served, then drop
 * the leftovers.
 *
 * Vercel’s Astro preset runs `astro build` (not `pnpm build`), so this must
 * also run from an adapter `astro:build:done` wrap.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collapseCspConfigFile } from "./collapse-csp.mjs";

const DEFAULT_OUTPUT_DIR = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.vercel/output",
);

/** Keep only Build Output API v3 entries after merging client assets. */
export const VERCEL_OUTPUT_KEEP = new Set(["config.json", "static", "functions"]);

/** Stay under Vercel’s ~3300kb `config.json` upload limit. */
export const VERCEL_CONFIG_SIZE_LIMIT = 3_000_000;

/**
 * @typedef {{
 *   changed: boolean,
 *   reason: string,
 *   removed?: string[],
 *   mergedClient?: boolean,
 *   configBytes?: number,
 * }} FinalizeResult
 */

/**
 * @param {string} [outputDir]
 * @returns {FinalizeResult}
 */
export function finalizeVercelOutput(outputDir = DEFAULT_OUTPUT_DIR) {
  if (!fs.existsSync(outputDir)) {
    console.log(`[finalize-vercel-output] ${outputDir} not found; skipping (node adapter build).`);
    return { changed: false, reason: "missing-output" };
  }

  collapseCspConfigFile(path.join(outputDir, "config.json"));

  const clientDir = path.join(outputDir, "client");
  const staticDir = path.join(outputDir, "static");
  let mergedClient = false;
  if (fs.existsSync(clientDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
    fs.cpSync(clientDir, staticDir, { recursive: true });
    mergedClient = true;
    console.log("[finalize-vercel-output] merged .vercel/output/client into static/");
  }

  const removed = [];
  for (const name of fs.readdirSync(outputDir)) {
    if (VERCEL_OUTPUT_KEEP.has(name)) continue;
    fs.rmSync(path.join(outputDir, name), { recursive: true, force: true });
    removed.push(name);
  }
  if (removed.length > 0) {
    console.log(`[finalize-vercel-output] removed leftover output: ${removed.join(", ")}`);
  }

  const configPath = path.join(outputDir, "config.json");
  let configBytes;
  if (fs.existsSync(configPath)) {
    configBytes = fs.statSync(configPath).size;
    if (configBytes > VERCEL_CONFIG_SIZE_LIMIT) {
      throw new Error(
        `[finalize-vercel-output] ${configPath} is ${configBytes} bytes; Vercel rejects config.json above ~3300kb.`,
      );
    }
  }

  return {
    changed: mergedClient || removed.length > 0,
    reason: "finalized",
    removed,
    mergedClient,
    configBytes,
  };
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  finalizeVercelOutput();
}
