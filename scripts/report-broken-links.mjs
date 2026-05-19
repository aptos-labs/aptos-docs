#!/usr/bin/env node
// Scans an `astro build` log for `starlight-links-validator` output and emits a
// human-readable broken-link report. Used by both the pre-push hook and CI.
//
// Reads the log from the path passed as argv[2], or from stdin if no path is given.
// Always exits 0 — broken links are a warning, not a failure.

import { appendFileSync, existsSync, readFileSync } from "node:fs";

const ANSI = /\x1b\[[0-9;]*m/g;
const stripAnsi = (s) => s.replace(ANSI, "");

function readLog() {
  const path = process.argv[2];
  if (path) {
    if (!existsSync(path)) {
      console.warn(`report-broken-links: log file '${path}' not found; skipping.`);
      process.exit(0);
    }
    return readFileSync(path, "utf8");
  }
  return readFileSync(0, "utf8");
}

const raw = readLog();
const log = stripAnsi(raw);

const failureHeader = /✗ Found (\d+) invalid (?:link|links) in (\d+) files?/;
const successHeader = /✓ All internal links are valid\./;

const failureMatch = log.match(failureHeader);

if (!failureMatch) {
  if (successHeader.test(log)) {
    console.log("report-broken-links: ✓ no broken links reported by starlight-links-validator.");
  } else {
    console.log(
      "report-broken-links: no starlight-links-validator output found in build log (validator may not have run).",
    );
  }
  process.exit(0);
}

// Extract from the `✗ Found ...` header through the rest of the validator block.
// The block ends when Astro's logger moves on to another plugin/phase — easiest
// heuristic is to slice up to either the wrapper's "downgraded to warning" line
// or a blank-line-followed-by-non-indented-non-validator line.
const startIdx = log.search(failureHeader);
let endIdx = log.indexOf("downgraded to warning", startIdx);
if (endIdx === -1) {
  // Fallback: take a generous chunk.
  endIdx = Math.min(log.length, startIdx + 8000);
} else {
  // Include the wrapper warning line itself.
  endIdx = log.indexOf("\n", endIdx);
  if (endIdx === -1) endIdx = log.length;
}

const section = log.slice(startIdx, endIdx).trimEnd();
const [, errorCount, fileCount] = failureMatch;

const summary = [
  "## ⚠️ Broken links detected",
  "",
  `\`starlight-links-validator\` found **${errorCount}** invalid link${errorCount === "1" ? "" : "s"} across **${fileCount}** file${fileCount === "1" ? "" : "s"}.`,
  "",
  "These are reported as **warnings** — the build still passes. Fix when convenient.",
  "",
  "```",
  section,
  "```",
  "",
].join("\n");

// Always print to stderr so it's visible in terminals / CI logs.
process.stderr.write(`\n${summary}\n`);

// In GitHub Actions, also surface to the job summary panel.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

process.exit(0);
