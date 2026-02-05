export interface SupportedLanguage {
  code: string;
  label: string;
  default?: boolean;
}

// Note: Spanish (es) temporarily removed to reduce bundle size for Vercel's 5MB limit
// See: https://github.com/aptos-labs/aptos-docs/pull/356
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", default: true },
  // { code: "es", label: "Español" }, // Temporarily disabled
  { code: "zh", label: "简体中文" },
];

// Site titles for each supported language
export const SITE_TITLES: Record<string, string> = {
  en: "Aptos Documentation",
  // es: "Documentación de Aptos", // Temporarily disabled
  zh: "Aptos 文档",
};
