/**
 * Search provider resolution.
 *
 * The docs site prefers Algolia DocSearch, but DocSearch depends on an Algolia
 * application that lives outside this repository. If that application is
 * deleted, its credentials are rotated, or its index is never crawled, every
 * query fails at request time and the site is left with no search at all
 * (the DocSearch plugin disables Starlight's built-in Pagefind search).
 *
 * To avoid that, the build probes the configured Algolia index once and only
 * ships DocSearch when the probe comes back with a populated index. Anything
 * else — a deleted application, a rejected key, an empty index, or a probe that
 * could not complete — ships Pagefind, because a local index that always works
 * beats a remote one that might not. Set `SEARCH_PROVIDER=algolia` to ship
 * DocSearch without probing.
 */

export type SearchProvider = "algolia" | "pagefind";

export type SearchProviderOverride = SearchProvider | "auto";

export interface AlgoliaCredentials {
  appId?: string | undefined;
  apiKey?: string | undefined;
  indexName?: string | undefined;
}

/** Why the Algolia probe passed or failed, in a form that is safe to log. */
export type AlgoliaHealthReason =
  | "ok"
  | "missing-credentials"
  | "unknown-application"
  | "unauthorized"
  | "unknown-index"
  | "empty-index"
  | "unexpected-status"
  | "network-error";

export interface AlgoliaHealth {
  healthy: boolean;
  reason: AlgoliaHealthReason;
  /** True when the failure looks temporary, so DocSearch should stay enabled. */
  transient: boolean;
  detail?: string;
  nbHits?: number;
}

export interface SearchResolution {
  provider: SearchProvider;
  /** Human-readable explanation of the decision, used for build logs. */
  reason: string;
  health?: AlgoliaHealth;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface AlgoliaHealthOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

export interface ResolveSearchProviderOptions extends AlgoliaHealthOptions {
  credentials: AlgoliaCredentials;
  /** Value of the `SEARCH_PROVIDER` environment variable, if set. */
  override?: string | undefined;
  /** Skip the network probe and trust the configured credentials. */
  skipHealthCheck?: boolean;
}

const DEFAULT_TIMEOUT_MS = 5000;

/** DNS errors that mean "this Algolia application does not exist". */
const FATAL_DNS_CODES = new Set(["ENOTFOUND", "ERR_NAME_NOT_RESOLVED"]);

export function hasAlgoliaCredentials(credentials: AlgoliaCredentials): boolean {
  return Boolean(credentials.appId && credentials.apiKey && credentials.indexName);
}

function normalizeOverride(value: string | undefined): SearchProviderOverride {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "algolia" || normalized === "pagefind" || normalized === "auto") {
    return normalized;
  }
  return "auto";
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const cause = (error as { cause?: unknown }).cause;
  const code =
    (error as { code?: unknown }).code ??
    (typeof cause === "object" && cause !== null ? (cause as { code?: unknown }).code : undefined);
  return typeof code === "string" ? code : undefined;
}

/**
 * Run a minimal search against the configured index. A `hitsPerPage=0` query
 * exercises the whole path — application lookup, API key permissions, index
 * existence and record count — in a single request without transferring hits.
 */
export async function checkAlgoliaHealth(
  credentials: AlgoliaCredentials,
  { fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS }: AlgoliaHealthOptions = {},
): Promise<AlgoliaHealth> {
  const { appId, apiKey, indexName } = credentials;
  if (!appId || !apiKey || !indexName) {
    return { healthy: false, reason: "missing-credentials", transient: false };
  }

  const url = `https://${appId.toLowerCase()}-dsn.algolia.net/1/indexes/${encodeURIComponent(
    indexName,
  )}/query`;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-algolia-application-id": appId,
        "x-algolia-api-key": apiKey,
      },
      body: JSON.stringify({ params: "query=&hitsPerPage=0" }),
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        healthy: false,
        reason: "unauthorized",
        transient: false,
        detail: `Algolia rejected the search API key (HTTP ${response.status}).`,
      };
    }
    if (response.status === 404) {
      return {
        healthy: false,
        reason: "unknown-index",
        transient: false,
        detail: `Index "${indexName}" does not exist in application ${appId}.`,
      };
    }
    if (!response.ok) {
      return {
        healthy: false,
        reason: "unexpected-status",
        transient: response.status >= 500,
        detail: `Algolia returned HTTP ${response.status}.`,
      };
    }

    const body = (await response.json()) as { nbHits?: number };
    const nbHits = typeof body.nbHits === "number" ? body.nbHits : 0;
    if (nbHits === 0) {
      return {
        healthy: false,
        reason: "empty-index",
        transient: false,
        nbHits,
        detail: `Index "${indexName}" is reachable but contains no records.`,
      };
    }

    return { healthy: true, reason: "ok", transient: false, nbHits };
  } catch (error) {
    const code = errorCode(error);
    if (code && FATAL_DNS_CODES.has(code)) {
      return {
        healthy: false,
        reason: "unknown-application",
        transient: false,
        detail: `Algolia application ${appId} does not resolve (${code}); it was most likely deleted.`,
      };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      reason: "network-error",
      transient: true,
      detail: code ? `${detail} (${code})` : detail,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Decide which search provider the build should ship. */
export async function resolveSearchProvider({
  credentials,
  override,
  skipHealthCheck = false,
  fetchImpl,
  timeoutMs,
}: ResolveSearchProviderOptions): Promise<SearchResolution> {
  const requested = normalizeOverride(override);

  if (requested === "pagefind") {
    return { provider: "pagefind", reason: "SEARCH_PROVIDER=pagefind" };
  }

  if (!hasAlgoliaCredentials(credentials)) {
    return {
      provider: "pagefind",
      reason:
        requested === "algolia"
          ? "SEARCH_PROVIDER=algolia but ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY or ALGOLIA_INDEX_NAME is missing"
          : "Algolia credentials are not configured",
    };
  }

  if (requested === "algolia") {
    return { provider: "algolia", reason: "SEARCH_PROVIDER=algolia" };
  }

  if (skipHealthCheck) {
    return { provider: "algolia", reason: "Algolia health check skipped" };
  }

  const health = await checkAlgoliaHealth(credentials, { fetchImpl, timeoutMs });

  if (health.healthy) {
    return {
      provider: "algolia",
      reason: `Algolia index is serving ${health.nbHits ?? 0} records`,
      health,
    };
  }

  return {
    provider: "pagefind",
    reason: health.transient
      ? `Algolia could not be verified (${health.reason}); falling back to Pagefind`
      : `Algolia is unusable (${health.reason}); falling back to Pagefind`,
    health,
  };
}
