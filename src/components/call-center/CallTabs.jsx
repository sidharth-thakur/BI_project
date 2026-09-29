/** Main CRM navigation tabs with live counts. */
export default function CallTabs({ active, onChange, counts }) {
  const tabs = [
    { key: "today", label: "Today's Calls", count: counts.today },
    { key: "due", label: "Due Calls", count: counts.due },
    { key: "upcoming", label: "Upcoming", count: counts.upcoming },
    { key: "dormant", label: "Dormant", count: counts.dormant },
    { key: "active", label: "All Active", count: counts.active },
  ];

  return (
    <div className="crm-tabs" role="tablist" aria-label="Call views">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`crm-tab${active === tab.key ? " active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          <span className="crm-tab-count">{tab.count}</span>
        </button>
      ))}
    </div>
  );
}
