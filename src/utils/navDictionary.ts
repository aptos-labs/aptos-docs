import type keys from "../content/nav/en.ts";

type NavKey = keyof typeof keys;

/**
 * Type helper for creating a dictionary of translations of sidebar labels.
 *
 * @example
 * // src/content/nav/fr.ts
 * import { navDictionary } from '../../utils/navDictionary';
 *
 * export default navDictionary({
 * 	start: 'Démarrer',
 * 	// ...
 * });
 */
export const navDictionary = (dict: Partial<Record<NavKey, string>>) => dict;
