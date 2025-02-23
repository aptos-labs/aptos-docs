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
  appId: getEnvVar("ALGOLIA_APP_ID", ALGOLIA_APP_ID),
  apiKey: getEnvVar("ALGOLIA_SEARCH_API_KEY", ALGOLIA_SEARCH_API_KEY),
  indexName: getEnvVar("ALGOLIA_INDEX_NAME", ALGOLIA_INDEX_NAME),
  searchParameters: {
    get facetFilters() {
      return getFacetFilters();
    },
  },
  insights: true,
} satisfies DocSearchClientOptions);
