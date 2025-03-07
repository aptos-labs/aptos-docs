import { useCallback, type ChangeEvent, type CSSProperties } from "react";
import { cx } from "class-variance-authority";
interface CustomSelectProps<Value extends string> {
  className?: string;
  id?: string;
  label: string;
  value: Value;
  width?: string;
  options: { value: string; label: string }[];
  onChange: (value: Value) => void;
}

export function CustomSelect<Value extends string>({
  className,
  id,
  label,
  value: currentValue,
  width,
  options,
  onChange,
}: CustomSelectProps<Value>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.target.value as Value);
    },
    [onChange],
  );

  // Calculate width-related classes based on width or use default
  const widthStyle = width ? { "--sl-select-width": width } : {};

  return (
    <label
      className="relative inline-flex items-center gap-1 text-[var(--sl-color-gray-1)] hover:text-[var(--sl-color-gray-2)]"
      style={widthStyle as CSSProperties}
    >
      <span className="sr-only">{label}</span>
      <select
        className={cx([
          "border-0 py-2.5 cursor-pointer appearance-none bg-transparent text-inherit truncate",
          "px-[calc(0.875rem+0.5rem+0.25rem)_calc(1.25rem+0.5rem+0.25rem)]",
          "-mx-2",
          "w-[calc(var(--sl-select-width,auto)+1rem)]",
          "md:text-sm",
          className,
        ])}
        id={id}
        value={currentValue}
        autoComplete="off"
        onChange={handleChange}
      >
        {options.map(({ value, label }) => (
          <option
            key={value}
            value={value}
            className="bg-[var(--sl-color-bg-nav)] text-[var(--sl-color-gray-1)]"
          >
            {label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="icon caret absolute top-1/2 -translate-y-1/2 pointer-events-none right-0 text-[1.25rem]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ "--sl-icon-size": "1em" } as CSSProperties}
      >
        <path d="M17 9.17a1 1 0 0 0-1.41 0L12 12.71 8.46 9.17a1 1 0 1 0-1.41 1.42l4.24 4.24a1.002 1.002 0 0 0 1.42 0L17 10.59a1.002 1.002 0 0 0 0-1.42Z" />
      </svg>
    </label>
  );
}
