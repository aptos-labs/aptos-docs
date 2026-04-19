/**
 * Guards the AI-agent discovery surface against silent drift.
 *
 * These endpoints are enumerated in the "Agent discovery & readiness" section
 * of CLAUDE.md / AGENTS.md. If you add or rename one, update both the checks
 * below and the agent rules doc so future agents know how to keep them fresh.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

function readJson<T = unknown>(relativePath: string): T {
  const body = readFileSync(resolve(ROOT, relativePath), "utf8");
  return JSON.parse(body) as T;
}

function readText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

interface LinksetEntry {
  anchor?: string;
  "service-desc"?: { href: string; type?: string; title?: string }[];
  "service-doc"?: { href: string; type?: string; title?: string }[];
  status?: { href: string }[];
  describedby?: { href: string }[];
}

describe("well-known API catalog (RFC 9727)", () => {
  const catalog = readJson<{ linkset: LinksetEntry[] }>("public/.well-known/api-catalog");

  it("has at least one linkset entry", () => {
    expect(Array.isArray(catalog.linkset)).toBe(true);
    expect(catalog.linkset.length).toBeGreaterThan(0);
  });

  it("every entry has an anchor and at least one link relation", () => {
    for (const entry of catalog.linkset) {
      expect(entry.anchor, "anchor").toMatch(/^https:\/\//);
      const relations = [
        entry["service-desc"],
        entry["service-doc"],
        entry.status,
        entry.describedby,
      ].filter((value) => Array.isArray(value) && value.length > 0);
      expect(relations.length, `entry ${entry.anchor} needs relations`).toBeGreaterThan(0);
    }
  });

  it("REST API entry still points at /aptos-spec.json and /rest-api", () => {
    const restEntry = catalog.linkset.find(
      (entry) => entry.anchor === "https://aptos.dev/rest-api",
    );
    expect(restEntry, "REST API linkset entry").toBeDefined();
    const desc = restEntry?.["service-desc"]?.[0]?.href;
    const doc = restEntry?.["service-doc"]?.[0]?.href;
    expect(desc).toBe("https://aptos.dev/aptos-spec.json");
    expect(doc).toBe("https://aptos.dev/rest-api");
  });
});

describe("MCP Server Card", () => {
  const card = readJson<{
    serverInfo?: { name?: string; version?: string };
    packages?: { identifier?: string; transport?: { type?: string } }[];
    capabilities?: Record<string, unknown>;
  }>("public/.well-known/mcp/server-card.json");

  it("has serverInfo.name and version", () => {
    expect(card.serverInfo?.name).toBeTruthy();
    expect(card.serverInfo?.version).toBeTruthy();
  });

  it("advertises the published Aptos MCP package", () => {
    const pkg = card.packages?.find((entry) => entry.identifier === "@aptos-labs/aptos-mcp");
    expect(pkg, "aptos-mcp package entry").toBeDefined();
    expect(pkg?.transport?.type).toBe("stdio");
  });

  it("declares at least one capability", () => {
    expect(card.capabilities, "capabilities").toBeDefined();
    expect(Object.keys(card.capabilities ?? {}).length).toBeGreaterThan(0);
  });
});

describe("Agent Skills discovery index", () => {
  const index = readJson<{
    $schema?: string;
    skills?: { name: string; type: string; url: string; digest: string }[];
  }>("public/.well-known/agent-skills/index.json");

  it("references the v0.2.0 schema", () => {
    expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
  });

  it("every skill entry has a sha256 digest and an https url", () => {
    const skills = index.skills ?? [];
    expect(skills.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const skill of skills) {
      expect(skill.name, "name").toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(skill.type, "type").toMatch(/^(skill-md|archive)$/);
      expect(skill.url, `${skill.name} url`).toMatch(/^https:\/\//);
      expect(skill.digest, `${skill.name} digest`).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(seen.has(skill.name), `duplicate skill name ${skill.name}`).toBe(false);
      seen.add(skill.name);
    }
  });
});

describe("robots.txt content signals", () => {
  const body = readText("public/robots.txt");

  it("declares Content-Signal for ai-train, search, and ai-input", () => {
    const line = body.split(/\r?\n/).find((candidate) => /^Content-Signal:/i.test(candidate));
    expect(line, "Content-Signal directive").toBeDefined();
    expect(line).toMatch(/ai-train=/);
    expect(line).toMatch(/search=/);
    expect(line).toMatch(/ai-input=/);
  });
});

describe("Head.astro in-page discovery links", () => {
  const head = readText("src/starlight-overrides/Head.astro");

  it("mirrors every Link header target as a <link rel> tag", () => {
    // Same URLs as the Link header in vercel.json — keep the two in sync.
    const expectedHrefs = [
      { href: "/.well-known/api-catalog", rel: "api-catalog" },
      { href: "/aptos-spec.json", rel: "service-desc" },
      { href: "/rest-api", rel: "service-doc" },
      { href: "/llms.txt", rel: "describedby" },
      { href: "/.well-known/mcp/server-card.json", rel: "alternate" },
      { href: "/.well-known/agent-skills/index.json", rel: "alternate" },
    ];
    for (const { href, rel } of expectedHrefs) {
      expect(head, `Head.astro missing ${href}`).toContain(`href="${href}"`);
      expect(head, `Head.astro missing rel="${rel}" for ${href}`).toContain(`rel="${rel}"`);
    }
  });
});

describe("middleware matcher", () => {
  const matcher = readText("src/middlewares/matcher-routes-dynamic.js");

  it("uses an anchored path (not a `$`-terminated regex) for locale roots", () => {
    // The generator wraps every matcher in `^...$`; a trailing `$` gets escaped
    // to `\$$`, so `/zh$` would only match the literal path `/zh$`. See
    // scripts/generate-middleware-matcher.js and PR #433 review feedback.
    expect(matcher).toContain('"/zh"');
    expect(matcher).not.toContain('"/zh$"');
  });
});

describe("vercel-middleware chain ordering", () => {
  const source = readText("src/vercel-middleware.ts");

  it("runs enRedirect before markdownNegotiation", () => {
    // /en/foo must have its prefix stripped before we try to rewrite to
    // /en/foo.md — the .md export route has no `en/` prefix and would 404.
    const enIdx = source.indexOf("enRedirect,");
    const mdIdx = source.indexOf("markdownNegotiation,");
    expect(enIdx, "enRedirect registration").toBeGreaterThan(-1);
    expect(mdIdx, "markdownNegotiation registration").toBeGreaterThan(-1);
    expect(enIdx).toBeLessThan(mdIdx);
  });
});

describe("vercel.json Link response header", () => {
  const vercel = readJson<{
    headers?: { source: string; headers: { key: string; value: string }[] }[];
  }>("vercel.json");

  const globalEntry = vercel.headers?.find((entry) => entry.source === "/(.*)");
  const linkHeader = globalEntry?.headers.find(
    (header) => header.key.toLowerCase() === "link",
  )?.value;

  it("is attached to every route", () => {
    expect(linkHeader, "Link header on /(.*)").toBeTruthy();
  });

  it("advertises every /.well-known agent discovery document", () => {
    expect(linkHeader).toContain("/.well-known/api-catalog");
    expect(linkHeader).toContain("/.well-known/mcp/server-card.json");
    expect(linkHeader).toContain("/.well-known/agent-skills/index.json");
    expect(linkHeader).toMatch(/rel="api-catalog"/);
    expect(linkHeader).toMatch(/rel="service-desc"/);
    expect(linkHeader).toMatch(/rel="service-doc"/);
  });

  it("pins the correct Content-Type on every well-known endpoint", () => {
    const pairs: Array<[string, RegExp]> = [
      ["/.well-known/api-catalog", /^application\/linkset\+json/],
      ["/.well-known/mcp/server-card.json", /^application\/json/],
      ["/.well-known/agent-skills/index.json", /^application\/json/],
    ];
    for (const [source, expected] of pairs) {
      const entry = vercel.headers?.find((item) => item.source === source);
      expect(entry, `headers entry for ${source}`).toBeDefined();
      const contentType = entry?.headers.find(
        (header) => header.key.toLowerCase() === "content-type",
      )?.value;
      expect(contentType, `Content-Type for ${source}`).toMatch(expected);
    }
  });
});
