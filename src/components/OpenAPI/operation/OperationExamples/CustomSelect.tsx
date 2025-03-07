import { useEffect, useRef, type PropsWithChildren } from "react";
import { invariant } from "~/lib/invariant";

type CustomSelectProps<Value extends string> = PropsWithChildren<{
  options?: { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}>;

export function CustomSelect<Value extends string>({
  options,
  value,
  onChange,
  children,
}: CustomSelectProps<Value>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const customSelect = useRef<HTMLElement | null>(null);

  useEffect(() => {
    invariant(containerRef.current, "containerRef is not defined");
    customSelect.current = containerRef.current.querySelector("custom-select");
    invariant(customSelect.current, "customSelect is not defined");

    function handleChange(event: Event) {
      onChange((event.target as HTMLSelectElement).value as Value);
    }

    customSelect.current.addEventListener("change", handleChange);

    return () => {
      customSelect.current?.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    customSelect.current?.setAttribute("value", value);
  }, [value]);

  useEffect(() => {
    if (options) {
      customSelect.current?.setAttribute("options", JSON.stringify(options));
    }
  }, [options]);

  return (
    <div className="contents" ref={containerRef}>
      {children}
    </div>
  );
}
