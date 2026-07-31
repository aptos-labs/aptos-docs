#!/usr/bin/env tsx
// Reports which search provider a build would ship and why.
//
// Run with `pnpm check:search`. Exits 1 when Algolia is configured but cannot
// serve results, so CI can catch a deleted application, a rotated search key,
// or an index the crawler never populated.

import { ENV } from "../src/lib/env.js";
import { checkAlgoliaHealth, hasAlgoliaCredentials, resolveSearchProvider } from "../src/config/search.js";

const credentials = {
  appId: ENV.ALGOLIA_APP_ID,
  apiKey: ENV.ALGOLIA_SEARCH_API_KEY,
  indexName: ENV.ALGOLIA_INDEX_NAME,
};

if (!hasAlgoliaCredentials(credentials)) {
  console.log("Algolia is not configured (ALGOLIA_APP_ID / ALGOLIA_SEARCH_API_KEY / ALGOLIA_INDEX_NAME).");
  console.log("The site will build with Starlight's built-in Pagefind search.");
  process.exit(0);
}

console.log(`Application: ${credentials.appId}`);
console.log(`Index:       ${credentials.indexName}`);

const health = await checkAlgoliaHealth(credentials);
const resolution = await resolveSearchProvider({
  credentials,
  override: ENV.SEARCH_PROVIDER,
});

if (health.healthy) {
  console.log(`Status:      healthy (${health.nbHits} records)`);
} else {
  console.log(`Status:      ${health.reason}${health.detail ? ` — ${health.detail}` : ""}`);
}
console.log(`Provider:    ${resolution.provider} (${resolution.reason})`);

if (health.healthy) process.exit(0);

if (health.transient) {
  console.warn(
    "\nThe failure looks temporary. Builds ship Pagefind until the probe succeeds, so re-run this check before assuming DocSearch is gone for good.",
  );
  process.exit(1);
}

console.error(
  [
    "",
    "Algolia cannot serve search results. To restore DocSearch:",
    "  1. Confirm the DocSearch application still exists in the Algolia dashboard.",
    "  2. Update ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY and ALGOLIA_INDEX_NAME wherever the site is deployed.",
    "  3. Re-run the DocSearch crawler so the index has records.",
    "",
    "Until then, builds fall back to Pagefind so the site keeps working search.",
  ].join("\n"),
);
process.exit(1);
