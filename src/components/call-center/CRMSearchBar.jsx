import { Search } from "lucide-react";

/** Large CRM search field covering company, contact, phone, notes and status. */
export default function CRMSearchBar({ value, onChange, resultCount }) {
  return (
    <div className="crm-search">
      <Search size={17} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search company, contact person, phone number..."
        aria-label="Search customers"
      />
      {resultCount !== undefined && resultCount !== null && (
        <span className="crm-search-count" aria-live="polite">
          {resultCount}
        </span>
      )}
    </div>
  );
}
