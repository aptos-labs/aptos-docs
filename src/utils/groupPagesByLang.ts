/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unnecessary-condition -- Astro's virtual modules (astro:content) have limited TypeScript support */
import type { CollectionEntry } from "astro:content";

/**
 * Groups collection entries by their language prefix in the ID
 *
 * @param entries - An array of CollectionEntry objects to group by language
 * @returns An object with language codes as keys and arrays of entries as values
 */
export const groupPagesByLang = <T extends CollectionEntry<"docs">>(
  entries: T[],
): Record<string, T[]> => {
  return entries.reduce<Record<string, T[]>>(
    (accumulator, entry) => {
      // Extract language code from the ID (first segment before slash)
      const idParts = (entry.id as string).split("/");

      // Ensure we have a valid string for the language code
      const lang: string = idParts[0] ?? "unknown";

      // Initialize the array for this language if it doesn't exist yet
      accumulator[lang] ??= [];

      // Add the entry to the appropriate language group
      accumulator[lang].push(entry);
      return accumulator;
    },
    {}, // Use a properly typed empty object as initial value
  );
};
