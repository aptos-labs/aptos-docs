/**
 * Ensures curated LLMs doc ids stay valid: files exist, are English paths, and are not draft.
 * Prevents silent drops from /llms.txt when content is renamed or unpublished.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import {
  FULL_PRIORITY_DOC_IDS,
  isEnglishDocId,
  LLMS_INDEX_SECTIONS,
  LLMS_SMALL_DOC_IDS,
} from "../src/lib/llms-curated-ids";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const DOCS_ROOT = join(ROOT, "src/content/docs");

function resolveDocFilePath(id: string): string | null {
  const base = join(DOCS_ROOT, id);
  if (existsSync(`${base}.mdx`)) return `${base}.mdx`;
  if (existsSync(`${base}.md`)) return `${base}.md`;
  return null;
}

function assertValidCuratedId(id: string) {
  expect(isEnglishDocId(id), `id "${id}" must be an English docs path`).toBe(true);
  const filePath = resolveDocFilePath(id);
  expect(filePath, `missing doc file for id "${id}"`).not.toBeNull();
  if (filePath === null) {
    return;
  }
  const raw = readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  expect(data.draft, `doc "${id}" must not be draft: true`).not.toBe(true);
}

describe("LLMs curated doc ids", () => {
  it("has no duplicate ids across LLMS_INDEX_SECTIONS", () => {
    const seen = new Set<string>();
    for (const section of LLMS_INDEX_SECTIONS) {
      for (const id of section.ids) {
        expect(seen.has(id), `duplicate curated id "${id}" in llms sections`).toBe(false);
        seen.add(id);
      }
    }
  });

  it("resolves every id in LLMS_INDEX_SECTIONS", () => {
    for (const section of LLMS_INDEX_SECTIONS) {
      for (const id of section.ids) {
        assertValidCuratedId(id);
      }
    }
  });

  it("resolves every id in LLMS_SMALL_DOC_IDS", () => {
    for (const id of LLMS_SMALL_DOC_IDS) {
      assertValidCuratedId(id);
    }
  });

  it("resolves every id in FULL_PRIORITY_DOC_IDS", () => {
    for (const id of FULL_PRIORITY_DOC_IDS) {
      assertValidCuratedId(id);
    }
  });
});
