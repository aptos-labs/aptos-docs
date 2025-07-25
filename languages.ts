const allLanguages = {
  en: "English",
  // de: 'Deutsch',
  es: "Español",
  zh: "简体中文",
  ja: "日本語",
  // 'pt-br': 'Português do Brasil',
  // es: 'Español',
  // 'zh-cn': '简体中文',
  // 'zh-tw': '正體中文',
  // fr: 'Français',
  // hi: 'हिन्दी',
  // ar: 'العربية',
  // ja: '日本語',
  // ko: '한국어',
  // pl: 'Polski',
  // ru: 'Русский',
  // it: 'Italiano',
} as const;

// Build for two languages only to speed up Astro's smoke tests
const twoLanguages = {
  en: "English",
  ja: "日本語",
} as const;

/**
 * Map of language codes to a written out language name.
 * Used to populate the language switcher in the navbar.
 */
export default import.meta.env.PUBLIC_TWO_LANG ? twoLanguages : allLanguages;

// export const rtlLanguages = new Set(['ar']);
