import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  finalizeVercelOutput,
  VERCEL_CONFIG_SIZE_LIMIT,
  VERCEL_OUTPUT_KEEP,
} from "../scripts/finalize-vercel-output.mjs";

const SHARED_CSP =
  "default-src 'self'; script-src-elem 'self' 'unsafe-inline'; style-src-elem 'self' 'unsafe-inline'";

const tempDirs: string[] = [];

function makeOutputDir() {
  const dir = mkdtempSync(join(tmpdir(), "vercel-output-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("finalizeVercelOutput", () => {
  it("merges client Monaco workers into static and drops leftover dirs", () => {
    const outputDir = makeOutputDir();
    mkdirSync(join(outputDir, "static/_astro"), { recursive: true });
    mkdirSync(join(outputDir, "client/monaco"), { recursive: true });
    mkdirSync(join(outputDir, "functions/_render.func"), { recursive: true });
    mkdirSync(join(outputDir, "_functions"), { recursive: true });
    mkdirSync(join(outputDir, "server"), { recursive: true });
    writeFileSync(join(outputDir, "static/_astro/page.js"), "static");
    writeFileSync(join(outputDir, "client/monaco/editor.worker.bundle.js"), "worker");
    writeFileSync(join(outputDir, "functions/_render.func/.vc-config.json"), "{}");
    writeFileSync(join(outputDir, "_functions/entry.mjs"), "leftover");
    writeFileSync(
      join(outputDir, "config.json"),
      `${JSON.stringify({
        version: 3,
        routes: [
          { src: "/", headers: { "content-security-policy": SHARED_CSP } },
          { src: "/about", headers: { "content-security-policy": SHARED_CSP } },
          { handle: "filesystem" },
        ],
      })}\n`,
    );

    const result = finalizeVercelOutput(outputDir);

    expect(result).toMatchObject({
      changed: true,
      reason: "finalized",
      mergedClient: true,
    });
    expect(result.removed?.sort()).toEqual(["_functions", "client", "server"]);
    expect(readFileSync(join(outputDir, "static/monaco/editor.worker.bundle.js"), "utf8")).toBe(
      "worker",
    );
    expect(readFileSync(join(outputDir, "static/_astro/page.js"), "utf8")).toBe("static");
    expect(readFileSync(join(outputDir, "functions/_render.func/.vc-config.json"), "utf8")).toBe(
      "{}",
    );
    expect(existsSync(join(outputDir, "_functions"))).toBe(false);
    expect(existsSync(join(outputDir, "client"))).toBe(false);
    expect(existsSync(join(outputDir, "server"))).toBe(false);
    const json = JSON.parse(readFileSync(join(outputDir, "config.json"), "utf8")) as {
      routes: { headers?: { "content-security-policy"?: string } }[];
    };
    expect(json.routes.filter((route) => route.headers?.["content-security-policy"])).toHaveLength(
      1,
    );
  });

  it("is a no-op when the output dir is already the Build Output API surface", () => {
    const outputDir = makeOutputDir();
    mkdirSync(join(outputDir, "static"), { recursive: true });
    mkdirSync(join(outputDir, "functions"), { recursive: true });
    writeFileSync(
      join(outputDir, "config.json"),
      `${JSON.stringify({
        version: 3,
        routes: [
          {
            src: "^/(.*)$",
            headers: { "content-security-policy": SHARED_CSP },
            continue: true,
          },
          { handle: "filesystem" },
        ],
      })}\n`,
    );

    const result = finalizeVercelOutput(outputDir);

    expect(result.mergedClient).toBe(false);
    expect(result.removed).toEqual([]);
    expect([...VERCEL_OUTPUT_KEEP].sort()).toEqual(["config.json", "functions", "static"]);
  });

  it("throws when config.json exceeds the Vercel upload budget", () => {
    const outputDir = makeOutputDir();
    writeFileSync(
      join(outputDir, "config.json"),
      JSON.stringify({
        version: 3,
        routes: [
          {
            src: "^/(.*)$",
            headers: { "content-security-policy": SHARED_CSP },
            continue: true,
          },
        ],
        padding: "x".repeat(VERCEL_CONFIG_SIZE_LIMIT),
      }),
    );

    expect(() => finalizeVercelOutput(outputDir)).toThrow(/3300kb/);
  });
});
