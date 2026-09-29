import Dropdown from "../common/Dropdown";
import Button from "../common/Button";
import { FOLLOW_FILTERS } from "../../services/callService";

/**
 * CRM filter row: status, priority, follow-up window (with custom date),
 * assigned-to and company. Everything updates the queue instantly.
 */
export default function CRMFilters({ filters, options, onChange, onReset, dirty = false }) {
  return (
    <div className="crm-filters">
      <Dropdown
        label={`Status: ${filters.status}`}
        value={`Status: ${filters.status}`}
        options={options.statuses}
        onSelect={(value) => onChange({ status: value })}
        align="left"
        ariaLabel="Filter by status"
      />
      <Dropdown
        label={`Priority: ${filters.priority}`}
        value={`Priority: ${filters.priority}`}
        options={options.priorities}
        onSelect={(value) => onChange({ priority: value })}
        align="left"
        ariaLabel="Filter by priority"
      />
      <Dropdown
        label={`Follow-up: ${filters.follow}`}
        value={`Follow-up: ${filters.follow}`}
        options={FOLLOW_FILTERS}
        onSelect={(value) => onChange({ follow: value })}
        align="left"
        ariaLabel="Filter by follow-up date"
      />
      {filters.follow === "Custom" && (
        <input
          type="date"
          className="crm-filter-date"
          value={filters.followCustom}
          onChange={(event) => onChange({ followCustom: event.target.value })}
          aria-label="Custom follow-up date"
        />
      )}
      <Dropdown
        label={`Assigned: ${filters.assigned}`}
        value={`Assigned: ${filters.assigned}`}
        options={options.assigned}
        onSelect={(value) => onChange({ assigned: value })}
        align="left"
        ariaLabel="Filter by assignee"
      />
      <Dropdown
        label={`Company: ${filters.company}`}
        value={`Company: ${filters.company}`}
        options={options.companies}
        onSelect={(value) => onChange({ company: value })}
        align="left"
        ariaLabel="Filter by company"
      />
      <span className="toolbar-spacer" />
      <Button variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>
        Reset Filters
      </Button>
    </div>
  );
}
