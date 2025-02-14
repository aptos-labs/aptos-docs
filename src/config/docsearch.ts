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
  appId: getEnvVar("ALGOLIA_APP_ID", ALGOLIA_APP_ID as string | undefined),
  apiKey: getEnvVar("ALGOLIA_SEARCH_API_KEY", ALGOLIA_SEARCH_API_KEY as string | undefined),
  indexName: getEnvVar("ALGOLIA_INDEX_NAME", ALGOLIA_INDEX_NAME as string | undefined),
  searchParameters: {
    get facetFilters() {
      return getFacetFilters();
    },
  },
} satisfies DocSearchClientOptions);
