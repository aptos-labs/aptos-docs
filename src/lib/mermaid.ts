import { cssId } from "./random/cssId";
import { ensureNonNullable } from "~/lib/ensureNonNullable";
import type { Theme } from "~/lib/theme";
import { $theme } from "~/stores/theme";
import { createIntersectionObserverAtom } from "~/lib/nanostores/createIntersectionObserverAtom";
import { effect } from "~/lib/nanostores/effect";

interface MermaidOptions {
  id: string;
  container: HTMLElement;
  graph: string;
  theme: Theme;
}

async function renderMermaid({ id, container, graph, theme }: MermaidOptions) {
  const { default: mermaid } = await import("mermaid");

  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      fontFamily: "inherit",
      themeCSS: "margin: 1.5rem auto 0;",
      theme: theme === "dark" ? "dark" : "default",
    });

    container.innerHTML = (await mermaid.render(id, graph)).svg;
  } catch (error) {
    // eslint-disable-next-line no-console -- show error
    console.error("Error while rendering mermaid", error);
  }
}

function upsertGraphContainer(element: HTMLDivElement) {
  let container: HTMLDivElement | null = element.querySelector(".mermaid-graph");

  if (!container) {
    container = document.createElement("div");
    container.classList.add("mermaid-graph");
    element.appendChild(container);
  }

  return container;
}

export function processMermaidExpressiveCodeBlock() {
  const expressiveCodeBlocks = document.querySelectorAll<HTMLDivElement>(".expressive-code");

  for (const codeBlock of expressiveCodeBlocks) {
    const { $atom: $diagramIsVisible, intersectionObserver } = createIntersectionObserverAtom({
      element: codeBlock,
      initialValue: false,
      mapper: (entry) => entry.isIntersecting,
      observerOptions: {
        rootMargin: "0px 0px 100% 0px", // Trigger when it is on the next screen
      },
    });
    const id = cssId();

    effect([$diagramIsVisible, $theme], (diagramIsVisible, theme) => {
      if (!diagramIsVisible) {
        return;
      }

      // Disconnect the observer once the diagram is visible
      // $diagramIsVisible will never change after this point
      intersectionObserver?.disconnect();

      const container = upsertGraphContainer(codeBlock);
      const copyButton = ensureNonNullable(
        codeBlock.querySelector<HTMLButtonElement>(".copy button"),
      );
      const graphData = (copyButton.dataset.code ?? "")
        .replace(/\u007F/g, "\n")
        .replaceAll("\\n", "\n");

      void renderMermaid({ id, theme, graph: graphData, container });
    });
  }
}
