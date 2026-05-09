import type { StarlightUserConfig } from "@astrojs/starlight/types";
import enLabels from "../content/nav/en";

// Define key types for navigation
type NavKey = keyof typeof enLabels;
type NavDict = Record<NavKey, string>;

// Derive sidebar item type from Starlight's public config type
type SidebarEntry = NonNullable<StarlightUserConfig["sidebar"]>[number];

// Config shape accepted by group() — label/translations are supplied internally
type GroupConfig = Omit<
  Extract<SidebarEntry, { items: unknown }>,
  "label" | "translations" | "badge"
>;

// Load translations from all language files
const translations = (() => {
  // Start with empty record
  const result: Record<NavKey, Record<string, string>> = {} as Record<
    NavKey,
    Record<string, string>
  >;

  // Initialize with empty objects for all known keys
  Object.keys(enLabels).forEach((key) => {
    result[key as NavKey] = {};
  });

  try {
    // Load all language files
    const langModules = import.meta.glob<{ default: NavDict }>("../content/nav/*.ts", {
      eager: true,
    });

    // Check if we have any language modules
    if (Object.keys(langModules).length === 0) {
      console.warn(
        "Warning: No translation files found in '../content/nav/*.ts'. " +
          "This may indicate that the directory doesn't exist or is empty. " +
          "Only English labels will be available.",
      );
    }

    // Process each language file's translations
    Object.entries(langModules).forEach(([path, mod]) => {
      const match = /\/([^/]+)\.ts$/.exec(path);
      if (!match?.[1]) return;

      const lang = match[1];
      const dict = mod.default;

      // Add translations to our result
      Object.keys(dict).forEach((key) => {
        if (Object.hasOwn(result, key)) {
          const navKey = key as NavKey;
          result[navKey][lang] = dict[navKey];
        }
      });
    });
  } catch (error) {
    console.error("Error loading translation files:", error);
    console.warn("Falling back to English-only labels");
  }

  return result;
})();

export function group(key: NavKey, config: GroupConfig): SidebarEntry {
  return {
    label: enLabels[key],
    translations: translations[key],
    ...config,
  } as SidebarEntry;
}
