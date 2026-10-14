// TODO: Move this data to our i18n system to support localized category labels.
const defaultCategory = "Learn";

// Order is important here. Pages are tested to see if they *start* with one of
// these paths and will return early when one matches. This means more specific
// paths need to be earlier in the array.
const categories = [
  ["build/smart-contracts/error-codes", "Error Reference"],
  ["build/aips", "Reference"],
  ["build/indexer/indexer-api/indexer-reference", "Reference"],
  ["build/external-resources", "Reference"],
  ["network/glossary", "Reference"],
  ["network/blockchain/transaction-payloads", "Reference"],
  ["rest-api", "Reference"],
] as const;

/**
 * Strip a leading locale prefix (`/zh/...`) and any remaining leading slash so
 * category paths can be matched the same way on English and translated URLs.
 */
function langAgnosticPathname(pathname: string): string {
  return pathname.replace(/^\/(?:en|zh|es|ja)(?=\/)/, "").replace(/^\//, "");
}

/**
 * @param url URL for the current page.
 * @returns The category for the current page as used by Algolia DocSearch to group search results.
 */
export function getPageCategory(url: { pathname: string }) {
  const langAgnosticPath = langAgnosticPathname(url.pathname);
  for (const [path, label] of categories) {
    if (langAgnosticPath.startsWith(path)) return label;
  }
  return defaultCategory;
}
