---
name: llm-seo-readiness
description: >-
  Validates Aptos docs changes for LLM consumption (llms.txt, curated feeds, Markdown exports, HTML→Markdown)
  and for SEO (metadata, sitemap, robots, structured data). Use when adding or restructuring docs, editing
  llms routes or curation, changing Head/meta/OG, updating robots.txt or sitemap behavior, or when the user
  mentions LLMs.txt, AI tool ingestion, crawlers, discoverability, or SEO.
---

# LLM and SEO readiness (Aptos docs)

## LLM / machine-readable

- **Frontmatter**: Every new or renamed doc needs accurate `title` and `description` in English; they surface in `/llms.txt` and `.md` exports. Mirror updates in `src/content/docs/zh/` per agent guidelines (Spanish `es/` is out of scope for agent-maintained docs).
- **Curated lists**: If a page should appear in the LLM index or early in full corpus, update `src/lib/llms-curated-ids.ts` (`LLMS_INDEX_SECTIONS`, `LLMS_SMALL_DOC_IDS`, `FULL_PRIORITY_DOC_IDS` as appropriate). Build fails if an id is missing from English non-draft docs.
- **Index copy**: User-facing explanations live in `src/content/docs/llms-txt.mdx`, `src/content/docs/build/ai.mdx`, and the Chinese `zh/` counterparts—keep URLs and feed names aligned with `src/pages/llms-index.ts`.
- **HTML → Markdown**: Shared logic is `src/lib/llms-html-sanitize.ts`. When minifying for `llms-small.txt`, collapse **spaces/tabs only**—never all `\s` (newlines must survive for fenced code and Markdown structure).
- **Route wiring**: Custom handlers are swapped in via `src/integrations/llms-txt-index.ts`; endpoint implementations live under `src/pages/llms-index.ts`, `src/pages/llms-small.txt.ts`, `src/pages/llms-full.txt.ts`.
- **Robots**: `public/robots.txt` should stay consistent with sitemap URL and, when feeds change, the commented LLMs.txt pointers at the bottom.

## SEO

- **Per-page metadata**: Starlight frontmatter `title` / `description` feed OG, Twitter, and schema in `src/starlight-overrides/Head.astro`—avoid empty or placeholder descriptions on public pages.
- **Sitemap**: Produced by `@astrojs/sitemap` in `astro.config.mjs`; ensure new top-level routes or major URL changes still make sense for indexing.
- **Hreflang / alternates**: Head override builds language alternates from `SUPPORTED_LANGUAGES`—new locales need config updates, not only content folders.
- **Draft / hidden content**: Do not rely on curated LLM ids or public sitemap for content that must stay off production; follow existing draft filtering in the `.md` pipeline and curation tests.

## Verification

After substantive changes:

```bash
pnpm test tests/llms-curated-ids.test.ts tests/llms-html-sanitize.test.ts
pnpm lint && pnpm check
```

For full coverage: `pnpm test` and a production `pnpm build` when touching routes or integrations.

## File map

| Area | Primary locations |
|------|-------------------|
| Curation | `src/lib/llms-curated-ids.ts`, `src/lib/llms.ts` |
| llms.txt body | `src/pages/llms-index.ts` |
| Feed endpoints | `src/pages/llms-small.txt.ts`, `src/pages/llms-full.txt.ts` |
| Plugin override | `src/integrations/llms-txt-index.ts` |
| Markdown export / sanitize | `src/lib/llms-html-sanitize.ts`, `src/pages/[...slug].md.ts` |
| User docs | `src/content/docs/llms-txt.mdx`, `build/ai.mdx`, `zh/` |
| SEO head | `src/starlight-overrides/Head.astro` |
| Crawlers / sitemap hint | `public/robots.txt` |
