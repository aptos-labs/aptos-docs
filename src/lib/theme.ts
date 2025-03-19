export type Theme = "light" | "dark";

export function getCurrentTheme(): Theme {
  return (document.documentElement.dataset.theme ?? "light") as Theme;
}

export function observeThemeChange(cb: (theme: Theme) => void) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
        cb(getCurrentTheme());
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Initial value
  cb(getCurrentTheme());

  return () => {
    observer.disconnect();
  };
}
