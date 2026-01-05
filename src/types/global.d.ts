/**
 * Global type declarations for View Transitions support.
 * These flags prevent duplicate event listener registration during SPA navigation.
 */

declare global {
  interface Window {
    // View Transitions initialization flags
    __starlightLanguageSelectPageLoadInit?: boolean;
    __askAptosChatButtonPageLoadListenerAdded?: boolean;
    __searchFallbackPageLoadListenerAdded?: boolean;
    __docSearchAltPageLoadListenerAdded?: boolean;
    __sidebarAutoScrollPageLoadInit?: boolean;
    __searchSuggestionsAstroBound?: boolean;

    // DocSearch related
    docsearch?: unknown;
    docsearchConfig?: Record<string, unknown>;

    // Search enhancements
    aptosSearchTermMappings?: Record<string, string>;
    aptosSearchSuggestions?: string[];
    enhanceSearchQuery?: (query: string) => string;
    getSearchMetrics?: () => Record<string, unknown[]>;
    clearSearchMetrics?: () => void;
  }
}

export {};
