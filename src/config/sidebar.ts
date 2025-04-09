import enLabels from "../content/nav/en";

// Define key types for navigation
type NavKey = keyof typeof enLabels;
type NavDict = Record<NavKey, string>;

// Define the sidebar entry types that align with Starlight's expected structure
interface SidebarItemCommon {
  label: string;
  translations?: Record<string, string>;
  collapsed?: boolean;
  icon?: string; // Add icon property back
}

// A link item in the sidebar
type SidebarLinkItem = SidebarItemCommon & {
  link: string;
  attrs?: Record<string, string | number | boolean>;
  badge?: BadgeConfig; // Added badge property
};

// Based on Starlight docs for badge config
type BadgeConfig =
  | string
  | {
      text: string | Record<string, string>; // Allow string or object for i18n
      variant?: "note" | "tip" | "danger" | "caution" | "success";
      class?: string;
    };

// Forward declaration to allow for recursive types
export type NestedSidebarItem = // Export the type
  string | SidebarLinkItem | SidebarGroupWithItems | SidebarGroupWithAutogenerate;

// A sidebar group with manual items
type SidebarGroupWithItems = SidebarItemCommon & {
  items: NestedSidebarItem[];
};

// A sidebar group with auto-generated items
type SidebarGroupWithAutogenerate = SidebarItemCommon & {
  autogenerate: { directory: string; collapsed?: boolean };
};

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
 * @param key - The key in the navigation dictionary
 * @param config - Configuration for the sidebar group
 * @returns A sidebar group entry compatible with Starlight's config
 */
// Define specific config types that include the optional icon
type GroupWithItemsConfig = Omit<SidebarGroupWithItems, "label" | "translations"> & {
  icon?: string;
};
type GroupWithAutogenerateConfig = Omit<SidebarGroupWithAutogenerate, "label" | "translations"> & {
  icon?: string;
};

/**
 * Create a sidebar group entry with labels and translations from nav files
 *
 * @param key - The key in the navigation dictionary
 * @param config - Configuration for the sidebar group, potentially including an icon
 * @returns A sidebar group entry compatible with Starlight's config
 */
export function group(
  key: NavKey,
  config: GroupWithItemsConfig | GroupWithAutogenerateConfig,
): SidebarGroupWithItems | SidebarGroupWithAutogenerate {
  return {
    label: enLabels[key],
    translations: translations[key],
    ...config,
  };
}
