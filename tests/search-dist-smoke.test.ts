/**
 * Post-build smoke checks for the search bar. CI runs `pnpm build` before
 * `pnpm test` (see .github/workflows/test.yml).
 *
 * These guard the two ways search has silently broken before: shipping a search
 * UI with nothing to search, and shipping one that stops working as soon as the
 * ClientRouter swaps the header.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CLIENT = join(ROOT, "dist/client");
const HOME = join(CLIENT, "index.html");
const PAGEFIND = join(CLIENT, "pagefind");

const hasBuildOutput = existsSync(HOME);
const hasPagefind = existsSync(PAGEFIND);

describe("search build output", () => {
  it.skipIf(!hasBuildOutput)("keeps the search UI mounted across view transitions", () => {
    // Both search UIs mount on `DOMContentLoaded`, which the ClientRouter never
    // fires again. Without the persisted wrapper the button goes dead after the
    // first client-side navigation.
    expect(readFileSync(HOME, "utf-8")).toContain('data-astro-transition-persist="site-search"');
  });

  it.skipIf(!hasBuildOutput || !hasPagefind)("ships a populated Pagefind index", () => {
    const entry = JSON.parse(readFileSync(join(PAGEFIND, "pagefind-entry.json"), "utf-8")) as {
      languages: Record<string, { page_count: number }>;
    };

    expect(Object.keys(entry.languages)).toContain("en");
    for (const [language, { page_count }] of Object.entries(entry.languages)) {
      expect(page_count, `Pagefind indexed no pages for "${language}"`).toBeGreaterThan(0);
    }
    expect(readdirSync(join(PAGEFIND, "fragment")).length).toBeGreaterThan(0);
  });

  it.skipIf(!hasBuildOutput || !hasPagefind)(
    "serves the search button Pagefind mounts into",
    () => {
      const home = readFileSync(HOME, "utf-8");
      expect(home).toContain("<site-search");
      expect(home).toContain("data-open-modal");
    },
  );
});
