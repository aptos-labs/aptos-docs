/**
 * Post-build smoke checks for prerendered LLMs router output and server routes.
 * CI runs `pnpm build` before `pnpm test` (see .github/workflows/test.yml).
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const LLMS_TXT = join(ROOT, "dist/client/llms.txt");
const LLMS_SMALL_SERVER = join(ROOT, "dist/server/pages/llms-small.txt.astro.mjs");
const LLMS_FULL_SERVER = join(ROOT, "dist/server/pages/llms-full.txt.astro.mjs");

const hasBuildOutput = existsSync(LLMS_TXT);

describe("LLMs static build output", () => {
  it.skipIf(!hasBuildOutput)("dist/client/llms.txt contains router markers", () => {
    const body = readFileSync(LLMS_TXT, "utf-8");
    expect(body).toContain("Machine-readable documentation");
    expect(body).toContain("llms-small.txt");
    expect(body).toContain("llms-full.txt");
    expect(body).toContain("aptos-spec.json");
    expect(body).toContain("Agent tooling and canonical sources");
    expect(body).toContain("@aptos-labs/aptos-mcp");
    expect(body).toContain("## Start Here");
    expect(body).toMatch(/\.md\)/);
  });

  it.skipIf(!hasBuildOutput)(
    "server bundle includes llms-small and llms-full route modules",
    () => {
      expect(existsSync(LLMS_SMALL_SERVER), "expected llms-small route in server build").toBe(true);
      expect(existsSync(LLMS_FULL_SERVER), "expected llms-full route in server build").toBe(true);
    },
  );
});
