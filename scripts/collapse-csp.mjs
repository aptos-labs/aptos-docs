#!/usr/bin/env node
/**
 * Collapse per-route Content-Security-Policy headers in
 * `.vercel/output/config.json` into one catch-all route.
 *
 * `@astrojs/vercel` `staticHeaders: true` emits one CSP route per pathname.
 * This site's policy is shared across pages (`'unsafe-inline'`, no hashes), so
 * hundreds of duplicates only inflate the file. Vercel then fails the deploy
 * with "Body exceeded 3300kb limit".
 *
 * `src/integrations/global-csp.ts` used to do this in `astro:build:done`, but
 * that hook runs before the adapter writes `config.json`, so waiting for the
 * file deadlocks. Run this *after* `astro build` and *before*
 * `build:generate-middleware-function` (that script splices middleware at
 * index 1).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.vercel/output/config.json",
);

/**
 * @typedef {{ src?: string, headers?: Record<string, string | undefined>, continue?: boolean, [key: string]: unknown }} VercelRoute
 * @typedef {{ routes?: VercelRoute[], [key: string]: unknown }} VercelConfig
 * @typedef {{ changed: boolean, reason: string, cspCount?: number }} CollapseResult
 */

/**
 * Mutates `json.routes` in place. Idempotent when the file is already collapsed
 * to a single shared policy.
 *
 * @param {VercelConfig} json
 * @returns {CollapseResult}
 */
export function collapseCspRoutes(json) {
  if (!Array.isArray(json.routes)) {
    return { changed: false, reason: "no-routes" };
  }

  const cspValues = json.routes
    .map((route) => route.headers?.["content-security-policy"])
    .filter((value) => typeof value === "string" && value.length > 0);
  const unique = new Set(cspValues);

  if (unique.size === 0) {
    return { changed: false, reason: "no-csp", cspCount: 0 };
  }

  if (unique.size > 1) {
    return { changed: false, reason: "distinct-csp", cspCount: cspValues.length };
  }

  const alreadyCollapsed =
    cspValues.length === 1 &&
    json.routes[0]?.src === "/(.*)" &&
    json.routes[0]?.continue === true &&
    json.routes[0]?.headers?.["content-security-policy"] === [...unique][0];
  if (alreadyCollapsed) {
    return { changed: false, reason: "already-collapsed", cspCount: 1 };
  }

  const csp = [...unique][0];

  json.routes = json.routes.filter((route) => {
    if (!route.headers?.["content-security-policy"]) return true;

    delete route.headers["content-security-policy"];
    if (Object.keys(route.headers).length === 0) {
      delete route.headers;
    }

    // Drop routes whose only remaining purpose was to attach CSP. `continue`
    // is also leftover from a previous collapse pass.
    const remainingKeys = Object.keys(route).filter((key) => key !== "src" && key !== "continue");
    return remainingKeys.length > 0;
  });

  json.routes.unshift({
    src: "/(.*)",
    headers: { "content-security-policy": csp },
    continue: true,
  });

  return { changed: true, reason: "collapsed", cspCount: cspValues.length };
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(`[collapse-csp] ${CONFIG_PATH} not found; skipping (node adapter build).`);
    return;
  }

  const json = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const result = collapseCspRoutes(json);

  if (result.reason === "distinct-csp") {
    console.warn(
      `[collapse-csp] ${result.cspCount} CSP routes have more than one distinct policy; leaving per-route headers in place.`,
    );
    return;
  }

  if (!result.changed) {
    console.log(`[collapse-csp] nothing to change (${result.reason}).`);
    return;
  }

  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(json, null, 2)}\n`);
  console.log(
    `[collapse-csp] collapsed ${result.cspCount} per-route CSP headers into one global /(.*) route.`,
  );
}

if (isMain()) {
  main();
}
