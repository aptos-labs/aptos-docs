export interface SupportedLanguage {
  code: string;
  label: string;
  default?: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", default: true },
  { code: "zh", label: "简体中文" },
];

// Site titles for each supported language
export const SITE_TITLES: Record<string, string> = {
  en: "Aptos Documentation",
  zh: "Aptos 文档",
};
