import { atom, onMount, type ReadableAtom } from "nanostores";

import { effect } from "./effect";
import { type ToAtom, toAtom } from "./toAtom";

interface IntersectionObserverAtomOptions<E extends HTMLElement, Mapped> {
  element: ToAtom<E | null>;
  initialValue: Mapped;
  mapper: (entry: IntersectionObserverEntry) => Mapped;
  observerOptions?: ReadableAtom<IntersectionObserverInit> | IntersectionObserverInit;
}

export function createIntersectionObserverAtom<E extends HTMLElement, Mapped>({
  element,
  initialValue,
  mapper,
  observerOptions,
}: IntersectionObserverAtomOptions<E, Mapped>): {
  $atom: ReadableAtom<Mapped>;
  intersectionObserver: IntersectionObserver | null;
} {
  const $result = atom(initialValue);
  const $element = toAtom(element);
  const $observerOptions = toAtom(observerOptions);
  let intersectionObserver: IntersectionObserver | null = null;

  onMount($result, () => {
    return effect([$element, $observerOptions], (element, observerOptions) => {
      if (!element) {
        return;
      }

      intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];

        if (entry) {
          $result.set(mapper(entry));
        }
      }, observerOptions);
      intersectionObserver.observe(element);

      return () => {
        intersectionObserver?.disconnect();
      };
    });
  });

  return { $atom: $result, intersectionObserver };
}
