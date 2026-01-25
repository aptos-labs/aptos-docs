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
   * Transforms search result URLs to use the current origin.
   * This enables search functionality in local development and preview environments.
   * @param items - Array of search result items from Algolia
   * @returns Transformed items with updated URLs
   */
  transformItems(items) {
    if (!Array.isArray(items)) {
      console.error("Expected items to be an array");
      return [];
    }

    return items.map((item) => {
      if (!item.url) {
        console.warn("Search result item missing URL");
        return item;
      }

      try {
        const url = new URL(item.url);
        url.protocol = window.location.protocol;
        url.host = window.location.host;

        return {
          ...item,
          url: url.href,
        };
      } catch {
        console.warn("Failed to parse URL:", item.url);
        return item;
      }
    });
  },
} satisfies DocSearchClientOptions);
