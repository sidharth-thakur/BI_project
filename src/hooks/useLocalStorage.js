import { useCallback, useState } from "react";

/**
 * State persisted to localStorage.
 * Useful for UI preferences (sidebar, filters) until a real backend exists.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((current) => {
        const next = typeof value === "function" ? value(current) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage may be unavailable (private mode) */
        }
        return next;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
