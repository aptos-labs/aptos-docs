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
 * A standalone `astro:build:done` integration cannot do this — that hook runs
 * *before* the adapter writes `config.json`. Either wrap the adapter (so
 * collapse runs after its own `build:done`) or run this script after
 * `astro build`. Vercel's Astro preset defaults to `astro build`, so the
 * adapter wrap is what actually runs in preview/production.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../.vercel/output/config.json",
);

/** PCRE catch-all, matching other routes the Vercel adapter emits. */
export const CSP_CATCH_ALL_SRC = "^/(.*)$";

/**
 * @typedef {{ src?: string, headers?: Record<string, string | undefined>, continue?: boolean, [key: string]: unknown }} VercelRoute
 * @typedef {{ routes?: VercelRoute[], [key: string]: unknown }} VercelConfig
 * @typedef {{ changed: boolean, reason: string, cspCount?: number }} CollapseResult
 */

function isCatchAllCspRoute(route, csp) {
  return (
    (route?.src === CSP_CATCH_ALL_SRC || route?.src === "/(.*)") &&
    route?.continue === true &&
    route?.headers?.["content-security-policy"] === csp
  );
}

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

  const csp = [...unique][0];
  const alreadyCollapsed =
    cspValues.length === 1 && isCatchAllCspRoute(json.routes[0], csp) && json.routes[0]?.src === CSP_CATCH_ALL_SRC;
  if (alreadyCollapsed) {
    return { changed: false, reason: "already-collapsed", cspCount: 1 };
  }

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
    src: CSP_CATCH_ALL_SRC,
    headers: { "content-security-policy": csp },
    continue: true,
  });

  return { changed: true, reason: "collapsed", cspCount: cspValues.length };
}

/**
 * Rewrite `.vercel/output/config.json` when it exists. Safe to call from the
 * Vercel adapter wrap (after `astro:build:done`) and from `pnpm build`.
 */
export function collapseCspConfigFile() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(`[collapse-csp] ${CONFIG_PATH} not found; skipping (node adapter build).`);
    return { changed: false, reason: "missing-file" };
  }

  const json = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const result = collapseCspRoutes(json);

  if (result.reason === "distinct-csp") {
    console.warn(
      `[collapse-csp] ${result.cspCount} CSP routes have more than one distinct policy; leaving per-route headers in place.`,
    );
    return result;
  }

  if (!result.changed) {
    console.log(`[collapse-csp] nothing to change (${result.reason}).`);
    return result;
  }

  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(json, null, 2)}\n`);
  console.log(
    `[collapse-csp] collapsed ${result.cspCount} per-route CSP headers into one global ${CSP_CATCH_ALL_SRC} route.`,
  );
  return result;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMain()) {
  collapseCspConfigFile();
}
