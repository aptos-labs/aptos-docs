# CLAUDE.md - AI Agent Guidelines for Aptos Documentation

This document provides essential guidelines for AI agents working on the Aptos Developer Documentation repository.

## Project Overview

This repository contains the official Aptos Developer Documentation, built using [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/). Published languages include English and Chinese (zh). Agent workflows here do **not** include creating or updating Spanish (`es`) documentation.

## Machine-readable documentation for agents

Production docs are indexed for LLMs and coding agents at [https://aptos.dev/llms.txt](https://aptos.dev/llms.txt) (same content as [https://aptos.dev/.well-known/llms.txt](https://aptos.dev/.well-known/llms.txt)). For IDE access to Aptos APIs and on-chain data, use the Aptos MCP server (`npx @aptos-labs/aptos-mcp`); see the live [AI tools](https://aptos.dev/build/ai) page.

## Agent discovery & readiness (keep fresh!)

The site advertises a full set of agent-discovery endpoints. Treat these as a single surface — if you touch one, audit the rest, update the matching docs, and re-run `pnpm test tests/agent-discovery.test.ts`.

| Concern                              | Source of truth                                        | Spec / reference                                                                 |
| ------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Global `Link` response header        | `vercel.json` → `headers[source="/(.*)"]`              | [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288)                               |
| In-page discovery `<link rel="…">`   | `src/starlight-overrides/Head.astro`                   | RFC 8288                                                                         |
| API catalog                          | `public/.well-known/api-catalog`                       | [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727)                               |
| MCP Server Card                      | `public/.well-known/mcp/server-card.json`              | [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) |
| Agent Skills index                   | `public/.well-known/agent-skills/index.json`           | [Agent Skills Discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc) |
| Agent Skills regeneration            | `scripts/generate-agent-skills-index.mjs`              | Pins `sha256:` digests from `aptos-labs/aptos-agent-skills@main`                 |
| Content Signals                      | `public/robots.txt` → `Content-Signal:` line           | [contentsignals.org](https://contentsignals.org/)                                |
| Markdown content negotiation         | `src/middlewares/markdown-negotiation.ts` + `src/vercel-middleware.ts` | Rewrites `Accept: text/markdown` requests to the `.md` export.      |
| Middleware matcher + bundle          | `scripts/generate-middleware-matcher.js`, `scripts/generate-middleware.js`, committed `middleware.js` | Matcher covers the locales + route prefixes middleware should run on. `generate-middleware.js` also copies the bundled middleware to the repo root so `scripts/generate-middleware-function.js` ships it — never hand-edit `middleware.js`. |
| MCP card regeneration                | Hand-maintained `public/.well-known/mcp/server-card.json` pinned to a real `@aptos-labs/aptos-mcp` version | Bump the `version` field and both `packages[0].version` + `packages[0].transport.args` whenever the npm package is released; never use `latest`. |
| WebMCP tools                         | `src/scripts/webmcp-register.ts` (+ `src/types/webmcp.d.ts`, `src/components/WebMcpRegistration.astro`) | [WebMCP draft](https://webmachinelearning.github.io/webmcp/)        |
| User-facing explainer                | `src/content/docs/build/ai.mdx` and `src/content/docs/zh/build/ai.mdx` | Keep the endpoint table and example `curl` in sync.                 |

Keep-fresh checklist when editing any of the above:

1. **Update the endpoint or config.** Changes to the Link header, MCP card, api-catalog, or Agent Skills index must go hand in hand — adding a new well-known endpoint means adding it to `vercel.json` (header + Content-Type) _and_ the Head override _and_ the `build/ai.mdx` tables (English + Chinese).
2. **Regenerate skill digests.** After bumping a skill in `aptos-labs/aptos-agent-skills`, run `node scripts/generate-agent-skills-index.mjs` so `sha256:` digests match upstream. Don't hand-edit the JSON.
3. **Rebuild the middleware bundle.** After any change to `src/vercel-middleware.ts`, the middleware order, the matcher, or any file under `src/middlewares/*`, run `pnpm build:middleware`. It regenerates both `.vercel/output/middleware/middleware.js` and the repo-root `middleware.js` (Prettier-formatted) that Vercel ships, so the committed bundle stays in sync with the TypeScript source.
4. **Run the guardrail tests.** `pnpm test tests/agent-discovery.test.ts tests/markdown-negotiation.test.ts` asserts the Link header, well-known payload shapes, Content Signals, Content-Type routing, and the markdown-negotiation routing decisions still line up. Both suites run as part of the default `pnpm test`.
5. **Update translations.** Anything added to `src/content/docs/build/ai.mdx` must appear in `src/content/docs/zh/build/ai.mdx` (Spanish is out of scope).
6. **Verify in production.** Once deployed, re-scan with `curl -sI https://aptos.dev/ | rg '^link:'` and an "Is It Agent Ready?" scan. If a signal regressed, note the fix in the PR description.

WebMCP specifics:

- The tool definitions live in `src/scripts/webmcp-register.ts` and are type-checked via `src/types/webmcp.d.ts`. Use those types when adding new tools — don't reach for `is:inline` scripts or `any`.
- The tool names (`aptos-docs.search`, `aptos-docs.open-doc`, `aptos-docs.fetch-doc-markdown`, `aptos-docs.list-llms-feeds`) are documented in `build/ai.mdx`; keep that list in sync when adding/removing tools.
- Markdown negotiation relies on the per-page `.md` exports from `src/pages/[...slug].md.ts`. Route changes that break those exports will also break the `fetch-doc-markdown` WebMCP tool.

## Development Setup

### Prerequisites

- **Node.js:** Version 22.x (use [nvm](https://github.com/nvm-sh/nvm))
- **pnpm:** Version 10.2.0 or higher (`npm install -g pnpm`)

### Quick Start

```bash
pnpm install        # Install dependencies
cp .env.example .env  # Set up environment variables
pnpm dev            # Start development server (http://localhost:4321)
```

## Essential Commands

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `pnpm dev`            | Start the development server  |
| `pnpm build`          | Build the site for production |
| `pnpm lint`           | Check for linting issues      |
| `pnpm format`         | Fix formatting issues         |
| `pnpm check`          | Run Astro type checking       |
| `pnpm format:content` | Format MDX content files      |

## Project Structure

```
src/
├── content/
│   ├── docs/           # Main English documentation
│   │   └── zh/         # Chinese translations
│   ├── i18n/           # UI translations
│   └── nav/            # Sidebar translations
├── components/         # Reusable components
├── config/             # Configuration helpers
└── assets/             # Site assets
```

A legacy `docs/es/` tree or URLs may still exist for redirects; do not add or maintain Spanish doc content under these agent guidelines.

## Critical Guidelines

### 1. Linting and Formatting

**IMPORTANT:** All changes must pass linting and formatting checks before completion.

```bash
pnpm lint      # Run all linters (eslint + prettier)
pnpm format    # Fix formatting issues
```

Run these commands after making changes to ensure code quality.

### 2. Translation Requirements

**Documentation changes that need localization must include the Chinese (`zh`) version.** Do not add or update Spanish (`es`) translations as part of agent work.

- **English docs:** `src/content/docs/`
- **Chinese docs:** `src/content/docs/zh/`

When modifying documentation:

1. Make the change in the English version first
2. Create or update the corresponding Chinese translation in `zh/`
3. Ensure Chinese internal links use the `/zh/...` prefix (see Internal Links below)

### 3. Commit Message Requirements

Every commit should have a clear, descriptive message that explains the changes made.

Format:

```
<type>: <description>

<optional body with more details>
```

Types:

- `docs`: Documentation changes
- `feat`: New features
- `fix`: Bug fixes
- `style`: Formatting changes
- `chore`: Maintenance tasks

Example:

```
docs: add glossary entry for BlockSTM

Added definition and example for BlockSTM parallel execution engine.
Updated Chinese translation accordingly.
```

### 4. Grammar and Style

**Grammar check every change** before committing. Ensure:

- Clear, concise language
- Consistent terminology throughout the documentation
- Proper sentence structure and punctuation
- Technical accuracy in all explanations
- Active voice preferred over passive voice

### 5. Glossary Requirements

**Ensure new terms are defined in the Glossary.**

The glossary is located at:

- **English:** `src/content/docs/network/glossary.mdx`
- **Chinese:** `src/content/docs/zh/network/glossary.mdx`

When adding a new term to the glossary:

1. **Define the term clearly** - Provide a concise, accurate definition
2. **Provide an example** - Include practical examples or use cases
3. **Add context** - Link to related documentation where appropriate
4. **Consider diagrams** - Add diagrams for complex concepts when helpful

Glossary entry format:

```markdown
### Term Name

- **Term Name** is [definition].
- [Additional context or explanation].

See [Related Page](/path/to/page) for more information.
```

### 6. MDX File Structure

Documentation files use MDX format with frontmatter:

```yaml
---
title: "Page Title"
description: "Brief description of the page content"
sidebar:
  label: "Sidebar Label" # Optional
---
```

### 7. Internal Links

Use relative paths without the file extension:

- English: `/network/blockchain/accounts`
- Chinese: `/zh/network/blockchain/accounts`

## Content Guidelines

### Writing Style

- Use clear, simple language accessible to developers of all skill levels
- Define technical terms on first use or link to the glossary
- Include code examples where appropriate
- Structure content with clear headings and subheadings

### Code Blocks

Use fenced code blocks with language identifiers:

```move
module example::hello {
    public fun greet(): vector<u8> {
        b"Hello, Aptos!"
    }
}
```

## Common Tasks

### Adding a New Documentation Page

1. Create the MDX file in the appropriate directory
2. Add frontmatter with title and description
3. Create Chinese translation in `zh/` subdirectory
4. Update sidebar configuration if needed (`astro.sidebar.ts`)
5. Run `pnpm lint` and `pnpm format`

### Updating the Glossary

1. Add the term to `src/content/docs/network/glossary.mdx`
2. Add Chinese translation to `src/content/docs/zh/network/glossary.mdx`
3. Ensure alphabetical ordering within each section
4. Include definition, examples, and links to related content

## Resources

- [LLM and SEO readiness (Cursor skill)](.cursor/skills/llm-seo-readiness/SKILL.md) — checklists for `llms.txt`, curated feeds, `.md` exports, and metadata/crawlers
- [Astro Documentation](https://docs.astro.build/)
- [Starlight Documentation](https://starlight.astro.build/)
- [MDX Documentation](https://mdxjs.com/)
- [Aptos Developer Portal](https://aptos.dev)

## Cursor Cloud specific instructions

This is a single-service Astro/Starlight documentation site. No databases, Docker, or external services are required for local development.

### Environment setup

- The VM snapshot provides Node 24+ (via nvm) and pnpm 10.30.3. The update script runs `pnpm install` automatically, so Biome, TypeScript, and Vitest are ready without manual setup.
- Ensure `.env` exists (copy from `.env.example` if missing). Default values are sufficient for local dev; optional services (Firebase, Algolia, OG images) degrade gracefully when their env vars are empty.
- pnpm may warn about ignored build scripts for native packages (`@swc/core`, `esbuild`, `sharp`, etc.) — these warnings are safe to ignore as the packages ship pre-built binaries.
- The repo's `.nvmrc` says `v22` and `engines` says `>=22`, but Node 24 is fully compatible and is what this environment uses.

### Running the dev server

- `pnpm dev` starts the Astro dev server at `http://localhost:4321`.
- The `predev` script automatically builds middleware matcher and starts middleware watcher in the background.
- Search (Algolia DocSearch) is disabled in dev mode; this is expected.

### Linting and testing

- `pnpm lint` runs Biome and Prettier in parallel (not ESLint, despite what some comments say).
- `pnpm test` runs Vitest tests.
- `pnpm check` runs Astro type checking.
- Git hooks: `pre-commit` runs `nano-staged` (Biome + Prettier on staged files), `pre-push` runs `astro check --noSync`.
