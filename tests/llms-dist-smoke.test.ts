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
const LLMS_SMALL_OUTPUT = join(ROOT, "dist/client/llms-small.txt");
const LLMS_FULL_OUTPUT = join(ROOT, "dist/client/llms-full.txt");

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

  it.skipIf(!hasBuildOutput)("build output includes llms-small.txt and llms-full.txt", () => {
    expect(existsSync(LLMS_SMALL_OUTPUT), "expected llms-small.txt in build output").toBe(true);
    expect(existsSync(LLMS_FULL_OUTPUT), "expected llms-full.txt in build output").toBe(true);
  });
});
