import { createEffect, onMount, type Accessor } from "solid-js";
import { invariant } from "~/lib/invariant";

interface CustomSelectProps<Value extends string> {
  options?: Accessor<{ value: Value; label: string }[]>;
  value: Accessor<Value>;
  onChange: (value: Value) => void;
  children: string;
}

export function CustomSelect<Value extends string>({
  options,
  value,
  onChange,
  children,
}: CustomSelectProps<Value>) {
  let containerRef: HTMLDivElement | undefined;
  let customSelect: HTMLElement | null = null;

  onMount(() => {
    invariant(containerRef, "containerRef is not defined");
    customSelect = containerRef.querySelector("custom-select");
    invariant(customSelect, "customSelect is not defined");

    function handleChange(event: Event) {
      onChange((event.target as HTMLSelectElement).value as Value);
    }

    customSelect.addEventListener("change", handleChange);

    return () => customSelect?.removeEventListener("change", handleChange);
  });

  createEffect(() => {
    customSelect?.setAttribute("value", value());
  });

  createEffect(() => {
    if (options) {
      customSelect?.setAttribute("options", JSON.stringify(options()));
    }
  });

  return <div class="contents" ref={containerRef} innerHTML={children} />;
}
