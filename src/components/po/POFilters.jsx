import { Plus, RotateCcw } from "lucide-react";
import SearchInput from "../common/SearchInput";
import Dropdown from "../common/Dropdown";
import Button from "../common/Button";

/**
 * PO Details toolbar: live search + company / month / status filters,
 * reset and the primary Add PO action.
 */
export default function POFilters({
  filters,
  options,
  onSearch,
  onPatch,
  onReset,
  onAdd,
  dirty = false,
  readOnly = false,
}) {
  return (
    <div className="toolbar po-toolbar">
      <SearchInput
        value={filters.search}
        onChange={onSearch}
        placeholder="Search PO / company"
        ariaLabel="Search purchase orders"
      />
      <Dropdown
        label={filters.company}
        value={filters.company}
        options={options.companies}
        onSelect={(value) => onPatch({ company: value })}
        align="left"
        ariaLabel="Filter by company"
      />
      <Dropdown
        label={filters.month}
        value={filters.month}
        options={options.months}
        onSelect={(value) => onPatch({ month: value })}
        align="left"
        ariaLabel="Filter by month"
      />
      <Dropdown
        label={filters.status}
        value={filters.status}
        options={options.statuses}
        onSelect={(value) => onPatch({ status: value })}
        align="left"
        ariaLabel="Filter by status"
      />
      <span className="toolbar-spacer" />
      <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
        <RotateCcw size={14} /> Reset
      </Button>
      {!readOnly && (
        <Button size="sm" onClick={onAdd}>
          <Plus size={15} /> Add PO
        </Button>
      )}
    </div>
  );
}
