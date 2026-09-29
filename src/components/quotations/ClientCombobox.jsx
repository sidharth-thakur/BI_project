import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Building2, Loader2, RotateCw, Search } from "lucide-react";
import { searchClients } from "../../services/clientService";

/**
 * Searchable client combobox. Selecting a client emits the normalized
 * { id, company, contact, address } record so the quotation form can
 * populate company, contact person and address automatically.
 */
export default function ClientCombobox({
  id = "client-search",
  onSelect,
  invalid = false,
  placeholder = "Search company name...",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryToken, setRetryToken] = useState(0);

  const rootRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const requestId = ++requestRef.current;

    async function run() {
      setLoading(true);
      setError("");
      const result = await searchClients(query);
      if (cancelled || requestId !== requestRef.current) return;
      if (result.ok) {
        setItems(result.items);
        setActiveIndex(result.items.length ? 0 : -1);
      } else {
        setItems([]);
        setError(result.error);
      }
      setLoading(false);
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, 150);

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, [open, query, retryToken]);

  function choose(item) {
    onSelect?.(item);
    setQuery(item.company);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        choose(items[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const listId = `${id}-listbox`;

  return (
    <div className="combo" ref={rootRef}>
      <div className={`combo-control${invalid ? " invalid" : ""}`}>
        <Search size={15} className="combo-lead" aria-hidden="true" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {loading && <Loader2 size={15} className="combo-spinner" aria-hidden="true" />}
      </div>

      {open && (
        <div className="combo-menu" role="listbox" id={listId}>
          {error ? (
            <div className="combo-note error">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>{error}</span>
              <button
                type="button"
                className="combo-retry"
                onClick={() => setRetryToken((token) => token + 1)}
              >
                <RotateCw size={13} aria-hidden="true" /> Retry
              </button>
            </div>
          ) : loading && !items.length ? (
            <div className="combo-note">
              <Loader2 size={15} className="combo-spinner" aria-hidden="true" />
              <span>Loading clients...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="combo-note">
              <Building2 size={15} aria-hidden="true" />
              <span>
                No clients found. Use “+ Add New Client” to create one.
              </span>
            </div>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`combo-option${index === activeIndex ? " active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item);
                }}
              >
                <span className="combo-option-name">{item.company}</span>
                <span className="combo-option-meta">
                  {item.contact || "Contact not set"}
                  {item.address ? ` · ${item.address}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
