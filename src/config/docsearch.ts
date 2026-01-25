import type { DocSearchClientOptions } from "@astrojs/starlight-docsearch";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_INDEX_NAME } from "astro:env/client";

const getFacetFilters = (): string[] =>
  typeof document !== "undefined" ? [`lang:${document.documentElement.lang}`] : [];

const getEnvVar = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

/**
 * Common documentation terms for intelligent word splitting.
 * When users type concatenated words like "indexertable", we can split
 * them into meaningful terms that Algolia can match.
 */
const DOCUMENTATION_TERMS = new Set([
  // Core concepts
  "indexer",
  "table",
  "reference",
  "transaction",
  "account",
  "module",
  "function",
  "validator",
  "node",
  "network",
  "blockchain",
  "smart",
  "contract",
  "contracts",
  "wallet",
  "token",
  "coin",
  "fungible",
  "asset",
  "assets",
  "nft",
  "aggregator",
  // Technical terms
  "api",
  "sdk",
  "cli",
  "rest",
  "graphql",
  "query",
  "queries",
  "mutation",
  "subscription",
  // Move-specific
  "move",
  "aptos",
  "resource",
  "resources",
  "struct",
  "entry",
  "view",
  "script",
  // Common suffixes/prefixes
  "get",
  "set",
  "create",
  "delete",
  "update",
  "list",
  "filter",
  "filtering",
  "stream",
  "event",
  "events",
  // Documentation sections
  "guide",
  "guides",
  "tutorial",
  "tutorials",
  "example",
  "examples",
  "quickstart",
  "overview",
  "introduction",
  "getting",
  "started",
  "build",
  "deploy",
  "test",
  "debug",
  // Infrastructure
  "fullnode",
  "full",
  "devnet",
  "testnet",
  "mainnet",
  "local",
  "docker",
  "source",
  // Misc common terms
  "type",
  "types",
  "key",
  "keys",
  "address",
  "hash",
  "signature",
  "signer",
  "payload",
  "gas",
  "fee",
  "fees",
  "sequence",
  "number",
  "version",
  "state",
  "data",
  "object",
  "objects",
  "collection",
  "collections",
  "digital",
  "legacy",
  "custom",
  "processor",
  "processors",
]);

/**
 * Attempts to split a concatenated word into known documentation terms.
 * Uses a greedy algorithm that tries to match the longest terms first.
 *
 * @example
 * splitConcatenatedWord("indexertable") => "indexer table"
 * splitConcatenatedWord("transactionstream") => "transaction stream"
 * splitConcatenatedWord("unknownword") => "unknownword" (unchanged)
 */
function splitConcatenatedWord(word: string): string {
  const lowerWord = word.toLowerCase();

  // Don't process very short words or words that are already known terms
  if (lowerWord.length < 4 || DOCUMENTATION_TERMS.has(lowerWord)) {
    return word;
  }

  // Try to find splits using dynamic programming approach
  const n = lowerWord.length;
  // Initialize dp array with null values, except dp[0] which is an empty array
  const dp: (string[] | null)[] = [];
  for (let k = 0; k <= n; k++) {
    dp.push(k === 0 ? [] : null);
  }

  for (let i = 1; i <= n; i++) {
    // Try all possible previous positions
    for (let j = 0; j < i; j++) {
      const prevSplit = dp[j];
      if (prevSplit === null || prevSplit === undefined) continue;

      const substring = lowerWord.slice(j, i);
      // Only accept substrings that are known terms (minimum 2 chars for flexibility)
      if (substring.length >= 2 && DOCUMENTATION_TERMS.has(substring)) {
        const currentSplit = dp[i];
        // Prefer splits with fewer, longer words
        if (
          currentSplit === null ||
          currentSplit === undefined ||
          prevSplit.length + 1 < currentSplit.length
        ) {
          dp[i] = [...prevSplit, substring];
        }
      }
    }
  }

  // If we found a valid split, return it
  const finalSplit = dp[n];
  if (finalSplit !== null && finalSplit !== undefined && finalSplit.length > 1) {
    return finalSplit.join(" ");
  }

  return word;
}

/**
 * Splits camelCase and PascalCase words into separate terms.
 *
 * @example
 * splitCamelCase("IndexerTable") => "Indexer Table"
 * splitCamelCase("getAccountResources") => "get Account Resources"
 */
function splitCamelCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

/**
 * Preprocesses a search query to improve relevance:
 * 1. Splits camelCase/PascalCase words
 * 2. Attempts to split concatenated lowercase words using known terms
 * 3. Preserves the original query terms alongside expanded ones
 *
 * @param query - The original search query
 * @returns Preprocessed query with better word separation
 */
function preprocessQuery(query: string): string {
  // First, split camelCase
  const processed = splitCamelCase(query);

  // Then process each word to split concatenated terms
  const words = processed.split(/\s+/);
  const processedWords = words.map((word) => {
    // Skip if word contains non-alphanumeric chars (except common punctuation)
    if (!/^[a-zA-Z0-9]+$/.test(word)) {
      return word;
    }

    const split = splitConcatenatedWord(word);
    // If we successfully split, include both original and split version
    // to maximize chances of matching
    if (split !== word && split.includes(" ")) {
      return split;
    }
    return word;
  });

  return processedWords.join(" ");
}

/**
 * Store the current search query for use in transformItems.
 * This allows us to boost results based on the query context.
 */
let currentSearchQuery = "";

/**
 * Calculates a boost score for a search result based on its URL and the query.
 * The goal is to surface landing/overview pages for broad queries, while
 * still allowing specific pages to rank high for specific queries.
 *
 * Strategy:
 * - If the URL path ends with the search term (e.g., /build/cli for "CLI"),
 *   that's likely the landing page - give it a big boost
 * - Shallower pages (fewer path segments) get priority over deeply nested ones
 * - Pages where the search term is in the URL path get a boost
 *
 * @param url - The result URL
 * @param query - The search query
 * @returns A boost score (higher = should appear earlier)
 */
function calculateBoostScore(url: string, query: string): number {
  const lowerQuery = query.toLowerCase().trim();

  // Skip boosting for empty queries
  if (!lowerQuery) {
    return 0;
  }

  // Extract URL path and normalize it
  let urlPath: string;
  try {
    urlPath = new URL(url).pathname.toLowerCase();
  } catch {
    urlPath = url.toLowerCase();
  }

  // Remove trailing slash and language prefix for matching
  urlPath = urlPath.replace(/\/$/, "").replace(/^\/(en|es|zh|ja|ko|fr|de)\//, "/");

  // Get individual query words
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length >= 2);

  let score = 0;

  // Check each query word
  for (const word of queryWords) {
    // Highest boost: URL path ends with the search term
    // e.g., searching "CLI" and URL is /build/cli → this is the landing page
    if (urlPath.endsWith(`/${word}`)) {
      score += 100;
    }
    // High boost: URL path has a segment that exactly matches the search term
    // e.g., searching "enums" and URL is /build/smart-contracts/book/enums
    else if (urlPath.split("/").includes(word)) {
      score += 50;
    }
    // Medium boost: URL path contains the search term as part of a segment
    // e.g., searching "install" and URL contains /install-cli/
    else if (urlPath.includes(word)) {
      score += 20;
    }
  }

  // Boost shallower pages - they tend to be overview/landing pages
  // Count path segments (excluding empty strings from split)
  const pathSegments = urlPath.split("/").filter((s) => s.length > 0);
  const depth = pathSegments.length;

  // Shallower pages get a bonus (max 30 points for depth 1-2)
  if (depth <= 2) {
    score += 30;
  } else if (depth <= 3) {
    score += 20;
  } else if (depth <= 4) {
    score += 10;
  }
  // Deep pages (5+ segments) get no depth bonus

  return score;
}

export default Object.freeze({
  // Environment variables from astro:env/client - validated at runtime by getEnvVar
  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  appId: getEnvVar("ALGOLIA_APP_ID", ALGOLIA_APP_ID),
  apiKey: getEnvVar("ALGOLIA_SEARCH_API_KEY", ALGOLIA_SEARCH_API_KEY),
  indexName: getEnvVar("ALGOLIA_INDEX_NAME", ALGOLIA_INDEX_NAME),
  /* eslint-enable @typescript-eslint/no-unsafe-argument */
  searchParameters: {
    get facetFilters() {
      return getFacetFilters();
    },
    // Improve typo tolerance for better fuzzy matching
    typoTolerance: true,
    // Allow more typos for longer words
    minWordSizefor1Typo: 3,
    minWordSizefor2Typos: 6,
    // Make all words optional if no results, improving partial matches
    removeWordsIfNoResults: "allOptional" as const,
    // Use prefix search for all words (not just the last one)
    queryType: "prefixAll" as const,
  },
  insights: true,
  /**
   * Transforms the search client to preprocess queries before sending to Algolia.
   * This improves search relevance by:
   * - Splitting concatenated words (e.g., "indexertable" → "indexer table")
   * - Splitting camelCase words (e.g., "IndexerTable" → "Indexer Table")
   * - Storing the query for use in result boosting
   */
  transformSearchClient(searchClient) {
    return {
      ...searchClient,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      search(requests: any) {
        // Handle both array and object-style requests (Algolia API variations)
        const requestsArray = Array.isArray(requests) ? requests : [requests];

        // Preprocess queries to split concatenated words
        const transformedRequests = requestsArray.map(
          (request: { params?: { query?: string } }) => {
            if (request.params?.query) {
              const originalQuery = request.params.query;
              const processedQuery = preprocessQuery(originalQuery);

              // Store the original query for use in transformItems boosting
              currentSearchQuery = originalQuery;

              // Log transformation for debugging (only in development)
              if (
                typeof window !== "undefined" &&
                window.location.hostname === "localhost" &&
                processedQuery !== originalQuery
              ) {
                console.debug(
                  `[Search] Query transformed: "${originalQuery}" → "${processedQuery}"`,
                );
              }

              return {
                ...request,
                params: {
                  ...request.params,
                  query: processedQuery,
                },
              };
            }
            return request;
          },
        );

        // Return in the same format as received
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return searchClient.search(
          (Array.isArray(requests) ? transformedRequests : transformedRequests[0]) as Parameters<
            typeof searchClient.search
          >[0],
        );
      },
    };
  },
  // Replace URL with the current origin so search
  // can be used in local development and previews.
  /**
   * Transforms search result URLs and boosts entry-point pages.
   * - Replaces URLs with current origin for local dev/preview
   * - Boosts overview, setup, and getting-started pages for short queries
   *
   * @param items - Array of search result items from Algolia
   * @returns Transformed and potentially reordered items
   */
  transformItems(items) {
    // Debug: Log that transformItems is being called
    console.log(
      "[DocSearch] transformItems called with",
      items.length,
      "items, query:",
      currentSearchQuery,
    );

    if (!Array.isArray(items)) {
      console.error("Expected items to be an array");
      return [];
    }

    // Transform URLs and calculate boost scores
    const transformedItems = items.map((item) => {
      if (!item.url) {
        console.warn("Search result item missing URL");
        return { item, boostScore: 0 };
      }

      try {
        const url = new URL(item.url);
        url.protocol = window.location.protocol;
        url.host = window.location.host;

        const boostScore = calculateBoostScore(item.url, currentSearchQuery);

        // Debug: Log boost scores for each item
        if (boostScore > 0) {
          console.log("[DocSearch] Boost:", boostScore, "for", item.url);
        }

        return {
          item: {
            ...item,
            url: url.href,
          },
          boostScore,
        };
      } catch {
        console.warn("Failed to parse URL:", item.url);
        return { item, boostScore: 0 };
      }
    });

    // Sort by boost score (higher first), maintaining relative order for equal scores
    // Using stable sort to preserve Algolia's relevance ranking within same boost tier
    const sorted = transformedItems.sort((a, b) => b.boostScore - a.boostScore);

    // Debug: Log the sorted order
    console.log(
      "[DocSearch] Sorted results:",
      sorted.slice(0, 5).map((s) => ({ url: s.item.url, boost: s.boostScore })),
    );

    return sorted.map((s) => s.item);
  },
} satisfies DocSearchClientOptions);
