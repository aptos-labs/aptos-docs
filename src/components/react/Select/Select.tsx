import { useCallback, type ChangeEvent, type CSSProperties } from "react";
import { type VariantProps, cva, cx } from "class-variance-authority";

const selectStyles = cva("cursor-pointer appearance-none text-inherit truncate bg-transparent", {
  variants: {
    variant: {
      ghost: cx("border-0"),
      bordered: cx("border border-[var(--sl-color-gray-5)]"),
    },
    size: {
      sm: "py-1 pl-3 pr-7 text-xs",
      md: "py-2 pl-4 pr-7 text-sm",
      lg: "py-2.5 px-7 text-sm",
    },
    iconOnly: {
      true: "",
    },
  },
  compoundVariants: [
    {
      size: "sm",
      iconOnly: true,
      class: "p-1.5 max-h-10 max-w-8",
    },
    {
      size: "md",
      iconOnly: true,
      class: "p-2.5 max-h-10 max-w-10",
    },
    {
      size: "lg",
      iconOnly: true,
      class: "p-3 max-h-10 max-w-12",
    },
  ],
  defaultVariants: { variant: "ghost", size: "md" },
});

interface CustomSelectProps<Value extends string> extends VariantProps<typeof selectStyles> {
  className?: string;
  id?: string;
  label: string;
  value: Value;
  width?: string;
  options: { value: string; label: string }[];
  onChange: (value: Value) => void;
}

export function Select<Value extends string>({
  className,
  id,
  label,
  variant,
  size,
  value: currentValue,
  options,
  onChange,
}: CustomSelectProps<Value>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChange(event.target.value as Value);
    },
    [onChange],
  );

  return (
    <label className="relative inline-flex items-center gap-1 text-[var(--sl-color-gray-1)] hover:text-[var(--sl-color-gray-2)]">
      <span className="sr-only">{label}</span>
      <select
        className={cx(selectStyles({ variant, size }), className)}
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
        className="icon caret absolute top-1/2 -translate-y-1/2 pointer-events-none right-2 text-[1.25rem]"
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
