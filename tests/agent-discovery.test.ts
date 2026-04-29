/**
 * Guards the AI-agent discovery surface against silent drift.
 *
 * These endpoints are enumerated in the "Agent discovery & readiness" section
 * of CLAUDE.md / AGENTS.md. If you add or rename one, update both the checks
 * below and the agent rules doc so future agents know how to keep them fresh.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

/**
 * Ensure a generated-at-build-time file exists before tests that inspect it
 * run. Lets `pnpm test` work on a clean checkout without requiring a prior
 * `pnpm build:middleware-matcher` step.
 */
function ensureGeneratedFile(relativePath: string, pnpmScript: string): void {
  const target = resolve(ROOT, relativePath);
  if (existsSync(target)) return;
  const pnpm = process.env.npm_execpath ?? "pnpm";
  execFileSync(pnpm, ["run", pnpmScript], { cwd: ROOT, stdio: "inherit" });
}

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
    name?: string;
    version?: string;
    description?: string;
    packages?: {
      identifier?: string;
      version?: string;
      transport?: { type?: string };
    }[];
  }>("public/.well-known/mcp/server-card.json");

  it("has a reverse-DNS name and a real semver version (not 'latest')", () => {
    expect(card.name, "name").toMatch(/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[a-z0-9-]+/);
    expect(card.version, "version").toBeTruthy();
    expect(card.version, "version cannot be 'latest'").not.toBe("latest");
    expect(card.version).toMatch(/^\d+\.\d+\.\d+(?:[-+].*)?$/);
  });

  it("keeps description within the SEP-2127 schema maxLength of 100", () => {
    // https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json
    expect(card.description).toBeTruthy();
    expect((card.description ?? "").length).toBeLessThanOrEqual(100);
  });

  it("advertises the published Aptos MCP package with a stdio transport", () => {
    const pkg = card.packages?.find((entry) => entry.identifier === "@aptos-labs/aptos-mcp");
    expect(pkg, "aptos-mcp package entry").toBeDefined();
    expect(pkg?.transport?.type).toBe("stdio");
    expect(pkg?.version, "packages[].version cannot be 'latest'").not.toBe("latest");
    expect(pkg?.version).toMatch(/^\d+\.\d+\.\d+(?:[-+].*)?$/);
  });
});

describe("Agent Skills discovery index", () => {
  const index = readJson<{
    $schema?: string;
    name?: string;
    publisher?: { name?: string; url?: string };
    source?: { repository?: string };
    skills?: { name: string; type: string; url: string; digest: string }[];
  }>("public/.well-known/agent-skills/index.json");

  it("references the v0.2.0 schema", () => {
    expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
  });

  it("identifies the publisher and the upstream source repository", () => {
    expect(index.name, "index name").toBeTruthy();
    expect(index.publisher?.name, "publisher.name").toBeTruthy();
    expect(index.publisher?.url, "publisher.url").toMatch(/^https:\/\//);
    expect(index.source?.repository, "source.repository").toMatch(
      /^https:\/\/github\.com\/aptos-labs\/aptos-agent-skills$/,
    );
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

describe("OAuth Protected Resource Metadata (RFC 9728)", () => {
  const metadata = readJson<{
    resource?: string;
    authorization_servers?: string[];
    scopes_supported?: string[];
    bearer_methods_supported?: string[];
    resource_name?: string;
    resource_documentation?: string;
  }>("public/.well-known/oauth-protected-resource");

  it("declares the faucet's resource identifier and authorization servers", () => {
    // Only the Aptos Testnet Faucet is OAuth-protected; the rest of aptos.dev
    // is unauthenticated public docs. Keep the resource pinned to the faucet
    // host so RFC 9728 validation (Section 3.3) succeeds.
    expect(metadata.resource, "resource").toBe("https://faucet.testnet.aptoslabs.com");
    expect(metadata.authorization_servers, "authorization_servers").toEqual(
      expect.arrayContaining(["https://securetoken.google.com/aptos-api-gateway-prod"]),
    );
    for (const issuer of metadata.authorization_servers ?? []) {
      expect(issuer, "authorization server issuer").toMatch(/^https:\/\//);
    }
  });

  it("advertises bearer-token usage and recommended scopes", () => {
    expect(metadata.bearer_methods_supported, "bearer_methods_supported").toEqual(
      expect.arrayContaining(["header"]),
    );
    expect(metadata.scopes_supported, "scopes_supported").toEqual(
      expect.arrayContaining(["openid"]),
    );
    expect(metadata.resource_name, "resource_name").toBeTruthy();
    expect(metadata.resource_documentation, "resource_documentation").toMatch(/^https:\/\//);
  });
});

describe("OpenID Connect Discovery 1.0 / OAuth Authorization Server Metadata (RFC 8414)", () => {
  const oidc = readJson<{
    issuer?: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    jwks_uri?: string;
    response_types_supported?: string[];
    grant_types_supported?: string[];
    id_token_signing_alg_values_supported?: string[];
  }>("public/.well-known/openid-configuration");

  const authServer = readJson<typeof oidc>("public/.well-known/oauth-authorization-server");

  it("OIDC config exposes issuer, authorization_endpoint, token_endpoint, and jwks_uri", () => {
    expect(oidc.issuer, "issuer").toMatch(/^https:\/\//);
    expect(oidc.authorization_endpoint, "authorization_endpoint").toMatch(/^https:\/\//);
    expect(oidc.token_endpoint, "token_endpoint").toMatch(/^https:\/\//);
    expect(oidc.jwks_uri, "jwks_uri").toMatch(/^https:\/\//);
  });

  it("OIDC config lists at least one grant type and response type", () => {
    expect((oidc.grant_types_supported ?? []).length).toBeGreaterThan(0);
    expect((oidc.response_types_supported ?? []).length).toBeGreaterThan(0);
    expect(
      oidc.id_token_signing_alg_values_supported,
      "id_token_signing_alg_values_supported",
    ).toEqual(expect.arrayContaining(["RS256"]));
  });

  it("oauth-authorization-server mirrors the same issuer", () => {
    // RFC 8414 and OIDC Discovery share the same metadata model — the issuer
    // must match across both documents so clients converge on a single
    // authorization server identity.
    expect(authServer.issuer, "oauth-authorization-server issuer").toBe(oidc.issuer);
    expect(authServer.token_endpoint, "oauth-authorization-server token_endpoint").toBe(
      oidc.token_endpoint,
    );
    expect(authServer.jwks_uri, "oauth-authorization-server jwks_uri").toBe(oidc.jwks_uri);
  });

  it("OIDC issuer matches the faucet resource metadata authorization_servers", () => {
    const protectedResource = readJson<{ authorization_servers?: string[] }>(
      "public/.well-known/oauth-protected-resource",
    );
    expect(protectedResource.authorization_servers, "authorization_servers").toEqual(
      expect.arrayContaining([oidc.issuer ?? ""]),
    );
  });
});

describe("robots.txt content signals", () => {
  const body = readText("public/robots.txt");

  function extractUserAgentGroups(source: string): { userAgent: string; body: string }[] {
    // Split by `User-agent:` lines, preserving the rest of the block that
    // follows (up to the next User-agent or EOF). Skip any preamble.
    const lines = source.split(/\r?\n/);
    const groups: { userAgent: string; body: string }[] = [];
    let current: { userAgent: string; body: string[] } | null = null;
    for (const line of lines) {
      const uaMatch = /^User-agent:\s*(.+)$/i.exec(line);
      if (uaMatch) {
        if (current) groups.push({ userAgent: current.userAgent, body: current.body.join("\n") });
        const name = (uaMatch[1] ?? "").trim();
        current = { userAgent: name, body: [] };
        continue;
      }
      if (current) current.body.push(line);
    }
    if (current) groups.push({ userAgent: current.userAgent, body: current.body.join("\n") });
    return groups;
  }

  it("declares Content-Signal inside every User-agent block", () => {
    // `Content-Signal:` is scoped to the most recently declared `User-agent:`
    // group (draft-romm-aipref-contentsignals), so a single directive under
    // `User-agent: *` would be invisible to the named AI crawlers above it.
    const groups = extractUserAgentGroups(body);
    expect(groups.length, "at least one User-agent group").toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.body, `Content-Signal missing from User-agent: ${group.userAgent}`).toMatch(
        /Content-Signal:.*ai-train=.*search=.*ai-input=/,
      );
    }
  });
});

describe("Head.astro in-page discovery links", () => {
  const head = readText("src/starlight-overrides/Head.astro");

  function hasLinkRel(href: string, rel: string): boolean {
    // Match a single `<link ...>` element that carries both attributes,
    // surviving Astro's auto-wrap formatting across attributes. We scan for
    // *any* `<link>` with this href/rel combo — there can be multiple links
    // to the same href with different rels (e.g. `rel="llms-txt"` and
    // `rel="describedby"` both point at `/llms.txt`).
    const hrefLiteral = href.replace(/[/.]/g, "\\$&");
    const relLiteral = rel.replace(/[-/.]/g, "\\$&");
    const hrefThenRel = new RegExp(
      `<link\\b[^>]*?href="${hrefLiteral}"[^>]*?rel="${relLiteral}"`,
      "s",
    );
    const relThenHref = new RegExp(
      `<link\\b[^>]*?rel="${relLiteral}"[^>]*?href="${hrefLiteral}"`,
      "s",
    );
    return hrefThenRel.test(head) || relThenHref.test(head);
  }

  it("mirrors every Link header target as a <link rel> tag", () => {
    // Same URLs as the Link header in vercel.json — keep the two in sync.
    const expectedHrefs: { href: string; rel: string }[] = [
      { href: "/.well-known/api-catalog", rel: "api-catalog" },
      { href: "/aptos-spec.json", rel: "service-desc" },
      { href: "/rest-api", rel: "service-doc" },
      { href: "/llms.txt", rel: "describedby" },
      { href: "/.well-known/mcp/server-card.json", rel: "describedby" },
      { href: "/.well-known/agent-skills/index.json", rel: "describedby" },
      { href: "/.well-known/oauth-protected-resource", rel: "describedby" },
      { href: "/.well-known/openid-configuration", rel: "describedby" },
    ];
    for (const { href, rel } of expectedHrefs) {
      expect(hasLinkRel(href, rel), `Head.astro missing <link rel="${rel}" href="${href}">`).toBe(
        true,
      );
    }
  });

  it("carries the same titles as the server-side Link header", () => {
    // The vercel.json Link entries set human-readable titles for the four
    // non-llms.txt agent-discovery resources. Mirror them in the in-page
    // <link> tags so HTML-only crawlers and browser DevTools see the same
    // labels. Keep this list in sync with vercel.json.
    const expectedTitles: { href: string; title: string }[] = [
      { href: "/aptos-spec.json", title: "Aptos REST API OpenAPI spec" },
      { href: "/rest-api", title: "Aptos REST API reference" },
      { href: "/.well-known/mcp/server-card.json", title: "Aptos MCP Server Card" },
      { href: "/.well-known/agent-skills/index.json", title: "Aptos Agent Skills index" },
      {
        href: "/.well-known/oauth-protected-resource",
        title: "Aptos Faucet OAuth Protected Resource Metadata",
      },
      {
        href: "/.well-known/openid-configuration",
        title: "Aptos Faucet OpenID Connect Discovery",
      },
    ];
    for (const { href, title } of expectedTitles) {
      const hrefLiteral = href.replace(/[/.]/g, "\\$&");
      const titleLiteral = title.replace(/[/.\s]/g, "\\$&");
      const pattern = new RegExp(
        `<link\\b[^>]*?(?:href="${hrefLiteral}"[^>]*?title="${titleLiteral}"|title="${titleLiteral}"[^>]*?href="${hrefLiteral}")`,
        "s",
      );
      expect(pattern.test(head), `Head.astro missing title="${title}" for ${href}`).toBe(true);
    }
  });
});

describe("middleware matcher", () => {
  // `src/middlewares/matcher-routes-dynamic.js` is generated by
  // `pnpm build:middleware-matcher` (listed in .gitignore). Regenerate it in
  // setup so the test works on a clean checkout without requiring a prior
  // `pnpm build` run.
  let matcher = "";
  beforeAll(() => {
    ensureGeneratedFile("src/middlewares/matcher-routes-dynamic.js", "build:middleware-matcher");
    matcher = readText("src/middlewares/matcher-routes-dynamic.js");
  });

  it("uses an anchored path (not a `$`-terminated regex) for locale roots", () => {
    // The generator wraps every matcher in `^...$`; a trailing `$` gets escaped
    // to `\$$`, so `/zh$` would only match the literal path `/zh$`. See
    // scripts/generate-middleware-matcher.js and PR #433 review feedback.
    expect(matcher).toContain('"/zh"');
    expect(matcher).not.toContain('"/zh$"');
  });

  it("includes top-level doc pages and their localized variants", () => {
    // Top-level `.mdx` docs like `src/content/docs/llms-txt.mdx` map to
    // `/llms-txt`; previously the matcher only listed `/${dir}/:path*`
    // entries so middleware (i18n redirect, markdown negotiation) never ran
    // on them. The generator must register both the English path and a
    // `/${locale}${path}` variant for every non-default locale, otherwise
    // /zh/llms-txt regresses to "no middleware".
    expect(matcher).toContain('"/llms-txt"');
    expect(matcher).toContain('"/zh/llms-txt"');
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

describe("committed middleware.js bundle", () => {
  const bundle = readText("middleware.js");

  it("uses the fixed /zh matcher (not the broken /zh$)", () => {
    // scripts/generate-middleware-function.js copies the repo-root
    // middleware.js into the Vercel deploy bundle, so the committed file
    // must track src/vercel-middleware.ts. Bundle freshness is enforced at
    // build time by the writeBundle hook in scripts/generate-middleware.js
    // (Vite plugin auto-copies the bundled output to the repo root). This
    // assertion catches the most common drift — the `/zh$` matcher bug we
    // shipped before — without coupling to specific middleware bodies.
    expect(bundle).toContain('"/zh"');
    expect(bundle).not.toContain('"/zh$"');
  });

  it("exports an Edge middleware default + matcher config", () => {
    // Structural shape only — no coupling to individual middleware bodies.
    expect(bundle).toMatch(/export default async function middleware/);
    expect(bundle).toMatch(/export const config\s*=\s*\{/);
    expect(bundle).toMatch(/matcher:\s*\[/);
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
    expect(linkHeader).toContain("/.well-known/oauth-protected-resource");
    expect(linkHeader).toContain("/.well-known/openid-configuration");
    expect(linkHeader).toMatch(/rel="api-catalog"/);
    expect(linkHeader).toMatch(/rel="service-desc"/);
    expect(linkHeader).toMatch(/rel="service-doc"/);
  });

  it("pins the correct Content-Type on every well-known endpoint", () => {
    const pairs: Array<[string, RegExp]> = [
      ["/.well-known/api-catalog", /^application\/linkset\+json/],
      ["/.well-known/mcp/server-card.json", /^application\/json/],
      ["/.well-known/agent-skills/index.json", /^application\/json/],
      ["/.well-known/oauth-protected-resource", /^application\/json/],
      ["/.well-known/openid-configuration", /^application\/json/],
      ["/.well-known/oauth-authorization-server", /^application\/json/],
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
