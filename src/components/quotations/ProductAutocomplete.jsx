import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, PackageSearch, RotateCw, Search } from "lucide-react";
import { searchProducts } from "../../services/productService";
import { formatAmount } from "../../services/quotationService";

/**
 * Searchable product / compound combobox powered by the Products Master
 * catalog. Enter and arrow keys select a suggestion; free typing is allowed
 * and is validated before saving.
 */
export default function ProductAutocomplete({
  id,
  value,
  onSelect,
  onChangeText,
  currency = "INR",
  invalid = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ?? "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryToken, setRetryToken] = useState(0);

  const rootRef = useRef(null);
  const listRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);

  /* Keep the input in sync when the parent resets the row (derived state). */
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(value ?? "");
  }

  /* Close when clicking outside. */
  useEffect(() => {
    function handleMouseDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  /* Fetch suggestions (debounced) whenever the popover is open. */
  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const requestId = ++requestRef.current;

    async function run() {
      setLoading(true);
      setError("");
      const result = await searchProducts(query);
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
    setQuery(item.name);
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

  function handleChange(event) {
    const text = event.target.value;
    setQuery(text);
    onChangeText?.(text);
    setOpen(true);
  }

  const listId = `${id ?? "product"}-listbox`;

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
          placeholder="Search product or compound..."
          onFocus={() => setOpen(true)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {loading && <Loader2 size={15} className="combo-spinner" aria-hidden="true" />}
      </div>

      {open && (
        <div className="combo-menu" role="listbox" id={listId} ref={listRef}>
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
              <span>Loading products...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="combo-note">
              <PackageSearch size={15} aria-hidden="true" />
              <span>
                No products found for “{query}”. Type a name to add it manually.
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
                <span className="combo-option-name">{item.name}</span>
                <span className="combo-option-meta">
                  HSN: {item.hsn} · Price: {formatAmount(item.price, currency)} ·{" "}
                  {item.timeline}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
