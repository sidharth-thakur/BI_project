/**
 * Large two-tab navigation for the PO module.
 * The active tab uses the V BIOCHEM accent as its indicator.
 */
export default function POTabs({ active, onChange }) {
  const tabs = [
    { key: "summary", label: "Monthly Summary" },
    { key: "details", label: "PO Details" },
  ];

  return (
    <div className="po-tabs" role="tablist" aria-label="Purchase order views">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`po-tab${active === tab.key ? " active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
