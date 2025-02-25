import type { DocSearchClientOptions } from "@astrojs/starlight-docsearch";

const getFacetFilters = (): string[] =>
  typeof document !== "undefined" ? [`lang:${document.documentElement.lang}`] : [];

export default Object.freeze({
  appId: "ASW7QTDNTH",
  apiKey: "58a3ad4a4a5cef88ef67d51f5a6dc8af",
  indexName: "aptos-starlight",
  searchParameters: {
    get facetFilters() {
      return getFacetFilters();
    },
  },
  insights: true,
} satisfies DocSearchClientOptions);
