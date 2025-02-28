import { type Accessor } from "solid-js";

interface CustomSelectProps<Value extends string> {
  class?: string;
  id?: string;
  label: string;
  value: Accessor<Value>;
  width?: string;
  options: Accessor<{ value: string; label: string }[]>;
  onChange: (value: Value) => void;
}

export function CustomSelect<Value extends string>(props: CustomSelectProps<Value>) {
  const handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onChange(target.value as Value);
  };

  // Calculate width-related classes based on props.width or use default
  const widthStyle = props.width ? { "--sl-select-width": props.width } : {};

  return (
    <label
      class="relative inline-flex items-center gap-1 text-[var(--sl-color-gray-1)] hover:text-[var(--sl-color-gray-2)]"
      style={widthStyle}
    >
      <span class="sr-only">{props.label}</span>
      <select
        class={`
          border-0 py-2.5 cursor-pointer appearance-none bg-transparent text-inherit truncate
          px-[calc(0.875rem+0.5rem+0.25rem)_calc(1.25rem+0.5rem+0.25rem)]
          -mx-2
          w-[calc(var(--sl-select-width,auto)+1rem)]
          md:text-sm
          ${props.class ?? ""}
        `}
        id={props.id}
        value={props.value()}
        autocomplete="off"
        onChange={handleChange}
      >
        {props.options().map(({ value, label }) => (
          <option
            value={value}
            selected={value === props.value()}
            class="bg-[var(--sl-color-bg-nav)] text-[var(--sl-color-gray-1)]"
          >
            {label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        class="icon caret absolute top-1/2 -translate-y-1/2 pointer-events-none right-0 text-[1.25rem]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        style="--sl-icon-size: 1em;"
      >
        <path d="M17 9.17a1 1 0 0 0-1.41 0L12 12.71 8.46 9.17a1 1 0 1 0-1.41 1.42l4.24 4.24a1.002 1.002 0 0 0 1.42 0L17 10.59a1.002 1.002 0 0 0 0-1.42Z"></path>
      </svg>
    </label>
  );
}
