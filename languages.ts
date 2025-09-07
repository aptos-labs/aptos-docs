const allLanguages = {
  en: "English",
  // de: 'Deutsch',
  es: "Español",
  pt: "Português",
  fr: "Français",
  tr: "Türkçe",
  ru: "Русский",
  ar: "العربية",
  zh: "简体中文",
  ko: "한국어",
  ja: "日本語",
  // es: 'Español',
  // 'zh-cn': '简体中文',
  // 'zh-tw': '正體中文',
  // hi: 'हिन्दी',
  // ja: '日本語',
  // pl: 'Polski',
  // it: 'Italiano',
} as const;

// Build for two languages only to speed up Astro's smoke tests
const twoLanguages = {
  en: "English",
  es: "Español",
} as const;

/**
 * Map of language codes to a written out language name.
 * Used to populate the language switcher in the navbar.
 */
export default import.meta.env.PUBLIC_TWO_LANG ? twoLanguages : allLanguages;

export const rtlLanguages = new Set(["ar"]);
