import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Clock3,
  Gauge,
  IndianRupee,
} from "lucide-react";

function kpiItems(kpis) {
  const trend = kpis.trend;
  const trendText =
    trend === null || trend === undefined
      ? "First month with POs"
      : trend === 0
        ? "Flat vs last month"
        : `${trend > 0 ? "+" : ""}${trend}% vs last month`;

  return [
    {
      key: "value",
      label: "Total PO Value",
      value: kpis.valueLabel,
      note: trendText,
      icon: IndianRupee,
      tone: trend > 0 ? "up" : trend < 0 ? "down" : "flat",
    },
    {
      key: "count",
      label: "Total POs",
      value: String(kpis.count),
      note: `This Year (${kpis.year})`,
      icon: ClipboardList,
      tone: "flat",
    },
    {
      key: "pending",
      label: "Pending Billing",
      value: String(kpis.pendingBilling),
      note: kpis.pendingBilling > 0 ? "Need Attention" : "All caught up",
      icon: Clock3,
      tone: kpis.pendingBilling > 0 ? "warn" : "flat",
    },
    {
      key: "billed",
      label: "Billed",
      value: `${kpis.billedPercent}%`,
      note: "Overall Progress",
      icon: Gauge,
      tone: "flat",
    },
  ];
}

/**
 * Four compact KPI cards. Every value is derived from the PO records
 * for the selected year — nothing is hardcoded.
 */
export default function POKpiCards({ kpis, loading = false }) {
  if (loading) {
    return (
      <section className="po-kpis" aria-label="Purchase order metrics">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="po-kpi-card">
            <span className="skeleton" style={{ height: 12, width: "45%" }} />
            <span className="skeleton" style={{ height: 26, width: "60%" }} />
            <span className="skeleton" style={{ height: 11, width: "35%" }} />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="po-kpis" aria-label="Purchase order metrics">
      {kpiItems(kpis).map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="po-kpi-card">
            <div className="po-kpi-top">
              <span className="po-kpi-label">{item.label}</span>
              <span className="po-kpi-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
            </div>
            <p className="po-kpi-value">{item.value}</p>
            <p className={`po-kpi-note tone-${item.tone}`}>
              {item.tone === "up" && <ArrowUpRight size={13} aria-hidden="true" />}
              {item.tone === "down" && <ArrowDownRight size={13} aria-hidden="true" />}
              {item.note}
            </p>
          </div>
        );
      })}
    </section>
  );
}
