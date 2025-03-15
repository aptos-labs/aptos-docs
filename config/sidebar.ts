import enLabels from "../src/content/nav/en";

// Define key types for navigation
type NavKey = keyof typeof enLabels;
type NavDict = Record<NavKey, string>;

// Define simple types for sidebar items that match Starlight's API
interface SidebarItemBase {
  label: string;
  collapsed?: boolean;
  translations?: Record<string, string>;
}

type SidebarGroupWithItems = SidebarItemBase & {
  items: (string | SidebarGroupWithItems | SidebarLinkItem)[];
};

type SidebarGroupWithAutogenerate = SidebarItemBase & {
  autogenerate: { directory: string; collapsed?: boolean };
};

type SidebarLinkItem = SidebarItemBase & {
  link: string;
  attrs?: Record<string, string | number | boolean>;
};

// Union type of all possible sidebar items
type SidebarItem = SidebarGroupWithItems | SidebarGroupWithAutogenerate | SidebarLinkItem;

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

  // Load all language files
  const langModules = import.meta.glob<{ default: NavDict }>("../src/content/nav/*.ts", {
    eager: true,
  });

  // Process each language file's translations
  Object.entries(langModules).forEach(([path, mod]) => {
    const match = /\/([^/]+)\.ts$/.exec(path);
    if (!match?.[1]) return;

    const lang = match[1];
    const dict = mod.default;

    // Add translations to our result
    Object.keys(dict).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        const navKey = key as NavKey;
        result[navKey][lang] = dict[navKey];
      }
    });
  });

  return result;
})();

/**
 * Create a sidebar group entry with labels and translations from nav files
 *
 * @param key - The key in the navigation dictionary
 * @param groupConfig - Configuration for the sidebar group
 * @returns A sidebar group entry
 */
export function group(
  key: NavKey,
  groupConfig:
    | Omit<SidebarGroupWithItems, "label" | "translations">
    | Omit<SidebarGroupWithAutogenerate, "label" | "translations">,
): SidebarItem {
  return {
    label: enLabels[key],
    translations: translations[key],
    ...groupConfig,
  };
}
