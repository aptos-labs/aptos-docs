import { atom, onMount } from "nanostores";
import { getCurrentTheme, observeThemeChange } from "~/lib/theme";

export const $theme = atom(getCurrentTheme());

onMount($theme, () => {
  return observeThemeChange((theme) => {
    $theme.set(theme);
  });
});
