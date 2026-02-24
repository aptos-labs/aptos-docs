import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

const SITE_URL = import.meta.env.SITE;

// Pages to exclude from the index entirely
const EXCLUDE_PAGES = new Set(["contribute/components/themed-image"]);

// Top-level section grouping and display order
const SECTION_CONFIG: Record<string, string> = {
  "build/get-started": "Getting Started",
  "build/guides": "Guides",
  "build/sdks": "SDKs",
  "build/smart-contracts": "Smart Contracts",
  "build/apis": "APIs",
  "build/cli": "CLI",
  "build/indexer": "Indexer",
  "build/ai": "AI Tools",
  "build/aips": "AIPs (Aptos Improvement Proposals)",
  "build/create-aptos-dapp": "Create Aptos Dapp",
  "network/blockchain": "Blockchain Concepts",
  "network/nodes": "Nodes",
  "network/faucet": "Faucet",
  "network/glossary": "Glossary",
  "network/releases": "Releases",
};

interface Doc {
  id: string;
  data: { title: string; description?: string };
}

function getSectionKey(slug: string): string {
  const keys = Object.keys(SECTION_CONFIG).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (slug.startsWith(key)) return key;
  }
  return "other";
}

/**
 * Derive sub-section key from page path. For a page like
 * "build/sdks/ts-sdk/account", the sub-section is "build/sdks/ts-sdk".
 * Only creates a sub-section if there's a directory level between the
 * section root and the page (i.e., depth >= section + 2 segments).
 */
function getSubSectionKey(slug: string, sectionKey: string): string | null {
  const remainder = slug.slice(sectionKey.length + 1); // after "build/sdks/"
  if (!remainder) return null;
  const parts = remainder.split("/");
  const first = parts[0];
  if (parts.length < 2 || !first) return null; // direct child of section, no sub-section
  return `${sectionKey}/${first}`;
}

function formatEntry(doc: Doc): string {
  const url = `${SITE_URL}/${doc.id}.md`;
  const desc = doc.data.description ? `: ${doc.data.description}` : "";
  return `- [${doc.data.title}](${url})${desc}`;
}

export const GET: APIRoute = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const docs = await getCollection("docs");

  // Filter to English-only, exclude 404, locale roots, and excluded pages
  const englishDocs = (docs as Doc[])
    .filter(
      (doc) =>
        !doc.id.startsWith("es/") &&
        !doc.id.startsWith("zh/") &&
        doc.id !== "es" &&
        doc.id !== "zh" &&
        !doc.id.includes("404") &&
        !EXCLUDE_PAGES.has(doc.id),
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  // Group by section
  const sections = new Map<string, Doc[]>();
  const topLevel: Doc[] = [];

  for (const doc of englishDocs) {
    const sectionKey = getSectionKey(doc.id);
    if (sectionKey === "other") {
      topLevel.push(doc);
    } else {
      if (!sections.has(sectionKey)) sections.set(sectionKey, []);
      const sectionList = sections.get(sectionKey);
      if (sectionList) sectionList.push(doc);
    }
  }

  // Build a lookup of slug -> doc for sub-section title resolution
  const docsBySlug = new Map<string, Doc>();
  for (const doc of englishDocs) {
    docsBySlug.set(doc.id, doc);
  }

  const lines: string[] = [
    "# Aptos Developer Documentation",
    "",
    "> Developer documentation for the Aptos blockchain — Move smart contracts, SDKs, APIs, indexer, node operations, and AI tools.",
    "",
    "This file lists all documentation pages with descriptions. Each page is also available as raw Markdown by appending `.md` to its URL (e.g. `https://aptos.dev/build/guides/first-transaction.md`).",
    "",
    "## Full Documentation",
    "",
    `- [Complete documentation](${SITE_URL}/llms-full.txt): All pages concatenated into a single file`,
    `- [Abridged documentation](${SITE_URL}/llms-small.txt): Condensed version for smaller context windows`,
    "",
  ];

  // Top-level pages
  for (const doc of topLevel) {
    lines.push(formatEntry(doc));
  }
  if (topLevel.length > 0) lines.push("");

  // Grouped sections with auto-derived sub-sections
  for (const [sectionKey, sectionLabel] of Object.entries(SECTION_CONFIG)) {
    const sectionDocs = sections.get(sectionKey);
    if (!sectionDocs || sectionDocs.length === 0) continue;

    lines.push(`## ${sectionLabel}`);
    lines.push("");

    // Split into direct children and sub-sectioned pages
    const directChildren: Doc[] = [];
    const subSections = new Map<string, Doc[]>();
    const subSectionOrder: string[] = [];

    for (const doc of sectionDocs) {
      const subKey = getSubSectionKey(doc.id, sectionKey);
      if (subKey) {
        if (!subSections.has(subKey)) {
          subSections.set(subKey, []);
          subSectionOrder.push(subKey);
        }
        const subList = subSections.get(subKey);
        if (subList) subList.push(doc);
      } else {
        directChildren.push(doc);
      }
    }

    // Print direct children first
    for (const doc of directChildren) {
      lines.push(formatEntry(doc));
    }

    // Print sub-sections
    for (const subKey of subSectionOrder) {
      const subDocs = subSections.get(subKey);
      if (!subDocs || subDocs.length === 0) continue;

      // Use the index page's title as the sub-section header, or derive from path
      const indexDoc = docsBySlug.get(subKey);
      const fallback = subKey.split("/").pop() ?? subKey;
      const subLabel = indexDoc ? indexDoc.data.title : fallback;

      lines.push("");
      lines.push(`### ${subLabel}`);
      lines.push("");

      for (const doc of subDocs) {
        lines.push(formatEntry(doc));
      }
    }

    lines.push("");
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
