import { type CollectionEntry, getCollection, render } from "astro:content";
import mdxJsxServer from "@astrojs/mdx/server.js";
import reactServer from "@astrojs/react/server.js";
import type { APIContext } from "astro";
import { experimental_AstroContainer } from "astro/container";
import { isEnglishDocId } from "./llms-curated-ids";
import { htmlToLlmsMarkdown } from "./llms-html-sanitize";

const CACHE_CONTROL_TTL = 60 * 60;

/** Prepended to llms-small.txt and llms-full.txt so agents see skills alongside corpus text. */
export const LLMS_FEED_AGENT_SKILLS_CALLOUT =
  "Aptos Agent Skills (https://github.com/aptos-labs/aptos-agent-skills) cover common workflows: write-contracts, generate-tests, security-audit, deploy-contracts, use-ts-sdk, ts-sdk-transactions, create-aptos-project, analyze-gas-optimization, modernize-move. Install the skill that matches the task before deep work.";

// Starlight MDX emits Astro JSX (`astro:jsx`); React alone cannot render those nodes.
const astroContainer = await experimental_AstroContainer.create({
  renderers: [
    { name: "astro:jsx", ssr: mdxJsxServer },
    { name: "@astrojs/react", ssr: reactServer },
  ],
});

astroContainer.addClientRenderer({
  name: "@astrojs/react",
  entrypoint: "@astrojs/react/client.js",
});

export type { LlmsSection } from "./llms-curated-ids";
export { LLMS_INDEX_SECTIONS, LLMS_SMALL_DOC_IDS } from "./llms-curated-ids";

export function isEnglishDoc(doc: CollectionEntry<"docs">): boolean {
  return isEnglishDocId(doc.id) && !doc.data.draft;
}

export async function getEnglishDocs() {
  const docs = await getCollection("docs");
  return docs.filter(isEnglishDoc);
}

export function orderDocs(
  docs: CollectionEntry<"docs">[],
  priorityIds: string[] = [],
): CollectionEntry<"docs">[] {
  const docsById = new Map(docs.map((doc) => [doc.id, doc]));
  const ordered: CollectionEntry<"docs">[] = [];
  const seen = new Set<string>();

  for (const id of priorityIds) {
    const doc = docsById.get(id);
    if (!doc || seen.has(id)) continue;
    ordered.push(doc);
    seen.add(id);
  }

  const remaining = docs
    .filter((doc) => !seen.has(doc.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  return [...ordered, ...remaining];
}

export async function renderDocToMarkdown(
  entry: CollectionEntry<"docs">,
  context: APIContext,
  shouldMinify = false,
) {
  const { Content } = await render(entry);
  const html = await astroContainer.renderToString(Content, context);
  return htmlToLlmsMarkdown(html, shouldMinify);
}

export async function generateLlmsDocument(
  docs: CollectionEntry<"docs">[],
  context: APIContext,
  {
    description,
    minify = false,
  }: {
    description: string;
    minify?: boolean;
  },
) {
  const segments: string[] = [`<SYSTEM>${description}</SYSTEM>`];

  for (const doc of docs) {
    const docSegments = [`# ${doc.data.hero?.title || doc.data.title}`];
    const descriptionText = doc.data.hero?.tagline || doc.data.description;
    if (descriptionText) {
      docSegments.push(`> ${descriptionText}`);
    }
    docSegments.push(await renderDocToMarkdown(doc, context, minify));
    segments.push(docSegments.join("\n\n"));
  }

  return segments.join("\n\n");
}

export function markdownUrl(siteUrl: string, docId: string) {
  return `${siteUrl.replace(/\/$/, "")}/${docId}.md`;
}

export function cacheHeaders(contentType = "text/plain; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": `public, max-age=${String(CACHE_CONTROL_TTL)}`,
    "X-Content-Type-Options": "nosniff",
  };
}
