import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function Dropdown({
  label,
  value,
  options = [],
  onSelect,
  align = "right",
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? label}
      >
        {value ?? label}
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open && (
        <div
          className={`dropdown-menu${align === "left" ? " align-left" : ""}`}
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`dropdown-item${option === value ? " selected" : ""}`}
              role="option"
              aria-selected={option === value}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
            >
              {option}
              {option === value && <Check size={14} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
