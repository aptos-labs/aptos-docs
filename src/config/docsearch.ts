import type { DocSearchClientOptions } from "@astrojs/starlight-docsearch";
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_INDEX_NAME } from "astro:env/client";

const getFacetFilters = (): string[] =>
  typeof document !== "undefined" ? [`lang:${document.documentElement.lang}`] : [];

const getEnvVar = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export default Object.freeze({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Astro env types may not resolve correctly in all environments
  appId: getEnvVar("ALGOLIA_APP_ID", ALGOLIA_APP_ID),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Astro env types may not resolve correctly in all environments
  apiKey: getEnvVar("ALGOLIA_SEARCH_API_KEY", ALGOLIA_SEARCH_API_KEY),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Astro env types may not resolve correctly in all environments
  indexName: getEnvVar("ALGOLIA_INDEX_NAME", ALGOLIA_INDEX_NAME),
  searchParameters: {
    get facetFilters() {
      return getFacetFilters();
    },
  },
  insights: true,
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
