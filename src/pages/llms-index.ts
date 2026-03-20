import type { APIRoute } from "astro";
import {
  cacheHeaders,
  getEnglishDocs,
  LLMS_INDEX_SECTIONS,
  type LlmsSection,
  markdownUrl,
} from "../lib/llms";

export const prerender = true;

const SITE_URL = import.meta.env.SITE;

interface Doc {
  id: string;
  data: { title: string; description?: string };
}

function formatEntry(doc: Doc): string {
  const url = markdownUrl(SITE_URL, doc.id);
  const desc = doc.data.description ? `: ${doc.data.description}` : "";
  return `- [${doc.data.title}](${url})${desc}`;
}

function resolveSectionDocs(section: LlmsSection, docsById: Map<string, Doc>): Doc[] {
  const missing = section.ids.filter((id) => !docsById.has(id));
  if (missing.length > 0) {
    throw new Error(
      `llms.txt section "${section.title}" is missing ${String(missing.length)} English (non-draft) doc(s): ${missing.join(", ")}`,
    );
  }
  return section.ids.map((id) => docsById.get(id) as Doc);
}

export const GET: APIRoute = async () => {
  const englishDocs = (await getEnglishDocs()) as Doc[];
  const docsById = new Map(englishDocs.map((doc) => [doc.id, doc]));

  const lines: string[] = [
    "# Aptos Developer Documentation",
    "",
    "> Developer documentation for the Aptos blockchain — Move smart contracts, SDKs, APIs, indexer, node operations, and AI tools.",
    "",
    `Canonical site: ${SITE_URL}`,
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    "",
    "This file is a compact router for LLMs and coding agents. It highlights the most useful Aptos docs first, while the full corpus remains available separately.",
    "",
    "Machine-readable documentation:",
    `- [Curated low-token docs](${SITE_URL}/llms-small.txt): concise Aptos reference for agents and IDE assistants.`,
    `- [Full documentation corpus](${SITE_URL}/llms-full.txt): complete rendered Aptos documentation for large-context ingestion.`,
    "",
    "Structured API assets (non-Markdown):",
    `- [Aptos Fullnode OpenAPI 3 spec](${SITE_URL}/aptos-spec.json): OpenAPI document for the node REST API (accounts, transactions, view functions, events).`,
    `- [REST API reference (HTML)](${SITE_URL}/rest-api): browsable docs generated from the same spec on this site.`,
    "",
    "Agent tooling and canonical sources:",
    "- [Aptos MCP on npm](https://www.npmjs.com/package/@aptos-labs/aptos-mcp): run `npx @aptos-labs/aptos-mcp` to give IDEs on-chain queries, REST helpers, and Move tooling.",
    "- [Aptos Agent Skills](https://github.com/aptos-labs/aptos-agent-skills): installable skills for Move, TypeScript SDK, and dApp scaffolding.",
    `- [AI tools hub](${markdownUrl(SITE_URL, "build/ai")}): MCP setup, Agent Skills, and LLMs.txt usage on one page (Markdown).`,
    "- [Aptos Labs on GitHub](https://github.com/aptos-labs): official SDKs, tools, and sample code.",
    "- [Aptos Explorer](https://explorer.aptoslabs.com/): look up accounts, transactions, validators, and network health.",
    `- [Aptos standards (AIPs)](${markdownUrl(SITE_URL, "build/smart-contracts/aptos-standards")}): tokens, naming, and other Aptos Improvement Proposal standards.`,
    `- [Indexer GraphQL reference](${markdownUrl(SITE_URL, "build/indexer/indexer-api/indexer-reference")}): schema-oriented reference for historical on-chain data (pairs with REST OpenAPI above).`,
    "",
    "Markdown access:",
    "- Documentation pages are available as rendered Markdown by appending `.md` to the canonical page URL.",
    `- Example: ${SITE_URL}/build/guides/first-transaction -> ${SITE_URL}/build/guides/first-transaction.md`,
    "",
  ];

  for (const section of LLMS_INDEX_SECTIONS) {
    if (section.ids.length === 0) {
      continue;
    }
    const docs = resolveSectionDocs(section, docsById);

    lines.push(`## ${section.title}`);
    lines.push("");
    for (const doc of docs) {
      lines.push(formatEntry(doc));
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: cacheHeaders(),
  });
};
