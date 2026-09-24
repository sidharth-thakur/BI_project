import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  shortcut = false,
  ariaLabel = "Search",
  ...props
}) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        {...props}
      />
      {shortcut && (
        <span className="kbd" aria-hidden="true">
          Ctrl + K
        </span>
      )}
    </div>
  );
}
