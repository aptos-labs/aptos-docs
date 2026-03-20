# CLAUDE.md - AI Agent Guidelines for Aptos Documentation

This document provides essential guidelines for AI agents working on the Aptos Developer Documentation repository.

## Project Overview

This repository contains the official Aptos Developer Documentation, built using [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/). Published languages include English and Chinese (zh). Agent workflows here do **not** include creating or updating Spanish (`es`) documentation.

## Machine-readable documentation for agents

Production docs are indexed for LLMs and coding agents at [https://aptos.dev/llms.txt](https://aptos.dev/llms.txt) (same content as [https://aptos.dev/.well-known/llms.txt](https://aptos.dev/.well-known/llms.txt)). For IDE access to Aptos APIs and on-chain data, use the Aptos MCP server (`npx @aptos-labs/aptos-mcp`); see the live [AI tools](https://aptos.dev/build/ai) page.

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
