/**
 * Registers WebMCP tools on every docs page for browsers that implement
 * `navigator.modelContext.registerTool()` (WebMCP draft; Chrome Early Preview).
 *
 * Tools exposed here let browser-side agents act on the docs without a remote
 * MCP round-trip:
 *   - aptos-docs.search:               open the site's search UI with a query.
 *   - aptos-docs.open-doc:             navigate to a same-origin docs path.
 *   - aptos-docs.fetch-doc-markdown:   fetch the current page's Markdown mirror.
 *   - aptos-docs.list-llms-feeds:      return LLMs.txt + discovery endpoint URLs.
 *
 * Runs as a no-op on browsers without `navigator.modelContext`. Injected from
 * `src/starlight-overrides/Head.astro` via a typed `<script>` tag, so the file
 * is type-checked with the rest of the codebase and bundled by Astro.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 */

import type {
  ModelContext,
  ModelContextToolDefinition,
} from "~/types/webmcp";

type ToolResult<T> = T | Promise<T>;

function getContext(): ModelContext | undefined {
  if (typeof navigator === "undefined") return undefined;
  const ctx = navigator.modelContext;
  if (!ctx || typeof ctx.registerTool !== "function") return undefined;
  return ctx;
}

function registerOnce(ctx: ModelContext, tool: ModelContextToolDefinition): void {
  // Astro bundled scripts run once per full page load and persist across SPA
  // view transitions, so duplicate registration shouldn't happen in practice.
  // We still guard with try/catch because a throw from registerTool() would
  // skip every tool registered after it.
  try {
    ctx.registerTool(tool);
  } catch (err) {
    console.debug("[webmcp] registerTool failed", tool.name, err);
  }
}

interface SearchInput {
  query: string;
}

interface OpenDocInput {
  path: string;
}

interface DiscoveryEndpoints {
  ok: true;
  feeds: { index: string; small: string; full: string };
  apiCatalog: string;
  mcpServerCard: string;
  agentSkills: string;
}

interface FetchMarkdownResult {
  ok: boolean;
  url: string;
  status?: number;
  markdown?: string;
  error?: string;
}

/**
 * Programmatically open the Algolia DocSearch modal and prefill the search box.
 *
 * DocSearch is rendered on every docs page by the starlight-docsearch plugin
 * (see `src/components/DocSearchButtonAlt.astro`). Clicking the `.DocSearch-Button`
 * mounts the modal; once mounted, DocSearch exposes an `input.DocSearch-Input`
 * whose value we set and bubble up via an `input` event so its internal store
 * updates and fetches results.
 */
async function openDocSearchWithQuery(query: string): Promise<boolean> {
  const button = document.querySelector<HTMLElement>(
    ".DocSearch-Button, .DocSearch-Button-Alt",
  );
  if (!button) return false;
  button.click();

  // The modal is portaled asynchronously; poll briefly for the input.
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const input = document.querySelector<HTMLInputElement>(".DocSearch-Input");
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      if (setter) setter.call(input, query);
      else input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

function searchTool(): ModelContextToolDefinition<
  SearchInput,
  Promise<{ ok: boolean; query: string; opened?: boolean; reason?: string }>
> {
  return {
    name: "aptos-docs.search",
    title: "Search Aptos developer docs",
    description:
      "Open the Aptos developer documentation search modal pre-populated with a query so the user can browse results. Uses Algolia DocSearch when available; otherwise no-ops.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query. Required, 1–200 characters.",
          minLength: 1,
          maxLength: 200,
        },
      },
      required: ["query"],
    },
    // Mutates the DOM (opens the DocSearch modal and focuses its input), so
    // it's not read-only. Matches the explicit annotation on `open-doc`.
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const query = typeof input?.query === "string" ? input.query.trim() : "";
      if (!query) return { ok: false, query: "", reason: "missing-query" };
      const opened = await openDocSearchWithQuery(query);
      return opened
        ? { ok: true, query, opened: true }
        : { ok: false, query, reason: "docsearch-unavailable" };
    },
  };
}

function openDocTool(): ModelContextToolDefinition<OpenDocInput, ToolResult<unknown>> {
  return {
    name: "aptos-docs.open-doc",
    title: "Open an Aptos docs page",
    description:
      "Navigate the current browser tab to a specific path on aptos.dev (e.g. `/build/sdks` or `/network/blockchain/accounts`). Side-effectful: replaces the user's tab.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Site-relative docs path starting with '/'. Example: /build/guides/first-transaction",
          pattern: "^/.*",
          maxLength: 512,
        },
      },
      required: ["path"],
    },
    // Explicit readOnlyHint:false so agents know this tool mutates browser
    // state. Non-destructive (we only swap the current tab's URL), so no
    // stronger hint is needed today. Watch the WebMCP spec for a navigation-
    // specific annotation and upgrade when available.
    annotations: { readOnlyHint: false },
    execute: (input) => {
      const path = typeof input?.path === "string" ? input.path : "";
      if (!path.startsWith("/")) {
        return { ok: false, reason: "invalid-path" as const };
      }
      const url = new URL(path, location.origin);
      if (url.origin !== location.origin) {
        return { ok: false, reason: "cross-origin" as const };
      }
      location.href = url.toString();
      return { ok: true, url: url.toString() };
    },
  };
}

function fetchMarkdownTool(): ModelContextToolDefinition<
  Record<string, never>,
  Promise<FetchMarkdownResult>
> {
  return {
    name: "aptos-docs.fetch-doc-markdown",
    title: "Fetch this doc as Markdown",
    description:
      "Return the rendered Markdown mirror of the current documentation page (the Markdown export at `<page>.md`). Useful for grounding an agent in the exact content the user is viewing.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => {
      // Mirror the path → markdown export mapping used by
      // src/middlewares/markdown-negotiation.ts. Astro's glob loader emits
      // slugs as `rawSegments.join("/").replace(/\/index$/, "")`, so
      // src/content/docs/zh/index.mdx maps to `/zh.md` (not `/zh/index.md`)
      // and src/content/docs/index.mdx maps to `/index.md`. The trailing-
      // slash strip handles `/build/sdks/` and `/zh/`; the empty-path
      // fallback handles the root.
      const basePath = location.pathname.replace(/\/$/, "") || "/index";
      const url = new URL(`${basePath}.md`, location.origin);
      try {
        const res = await fetch(url.toString(), {
          headers: { Accept: "text/markdown" },
        });
        if (!res.ok) {
          return { ok: false, status: res.status, url: url.toString() };
        }
        const markdown = await res.text();
        return { ok: true, url: url.toString(), markdown };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, url: url.toString(), error: message };
      }
    },
  };
}

function listFeedsTool(): ModelContextToolDefinition<
  Record<string, never>,
  DiscoveryEndpoints
> {
  return {
    name: "aptos-docs.list-llms-feeds",
    title: "List Aptos LLMs.txt and agent discovery feeds",
    description:
      "Return the URLs of the Aptos documentation LLMs.txt feeds (index, condensed, full) plus the agent discovery endpoints (api-catalog, MCP server card, agent-skills index).",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => ({
      ok: true,
      feeds: {
        index: new URL("/llms.txt", location.origin).toString(),
        small: new URL("/llms-small.txt", location.origin).toString(),
        full: new URL("/llms-full.txt", location.origin).toString(),
      },
      apiCatalog: new URL("/.well-known/api-catalog", location.origin).toString(),
      mcpServerCard: new URL(
        "/.well-known/mcp/server-card.json",
        location.origin,
      ).toString(),
      agentSkills: new URL(
        "/.well-known/agent-skills/index.json",
        location.origin,
      ).toString(),
    }),
  };
}

function registerAll(ctx: ModelContext): void {
  // Order matters only for console/debugging: keep read-only tools first.
  registerOnce(ctx, listFeedsTool() as ModelContextToolDefinition);
  registerOnce(ctx, searchTool() as ModelContextToolDefinition);
  registerOnce(ctx, openDocTool() as ModelContextToolDefinition);
  registerOnce(ctx, fetchMarkdownTool() as ModelContextToolDefinition);
}

const ctx = getContext();
if (ctx) registerAll(ctx);
