import {
  AlertTriangle,
  CalendarClock,
  Hourglass,
  PhoneCall,
  Users,
} from "lucide-react";

function items(kpis) {
  return [
    {
      key: "today",
      label: "Today's Calls",
      value: kpis.today,
      note: "Scheduled for today",
      icon: PhoneCall,
      tone: "accent",
    },
    {
      key: "overdue",
      label: "Overdue",
      value: kpis.overdue,
      note: "Need attention",
      icon: AlertTriangle,
      tone: kpis.overdue > 0 ? "warn" : "muted",
    },
    {
      key: "upcoming",
      label: "Upcoming",
      value: kpis.upcoming,
      note: "Next 7 days",
      icon: CalendarClock,
      tone: "muted",
    },
    {
      key: "dormant",
      label: "Dormant",
      value: kpis.dormant,
      note: "No recent activity",
      icon: Hourglass,
      tone: kpis.dormant > 0 ? "warn" : "muted",
    },
    {
      key: "active",
      label: "Active Leads",
      value: kpis.active,
      note: "Currently being followed",
      icon: Users,
      tone: "accent",
    },
  ];
}

/** Five KPI cards — every value derived from the CRM records. */
export default function CRMKpiCards({ kpis, loading = false }) {
  if (loading) {
    return (
      <section className="crm-kpis" aria-label="Call centre metrics">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="crm-kpi-card">
            <span className="skeleton" style={{ height: 12, width: "55%" }} />
            <span className="skeleton" style={{ height: 26, width: "40%" }} />
            <span className="skeleton" style={{ height: 11, width: "50%" }} />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="crm-kpis" aria-label="Call centre metrics">
      {items(kpis).map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className={`crm-kpi-card tone-${item.tone}`}>
            <div className="crm-kpi-top">
              <span className="crm-kpi-label">{item.label}</span>
              <span className="crm-kpi-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
            </div>
            <p className="crm-kpi-value">{item.value}</p>
            <p className="crm-kpi-note">{item.note}</p>
          </div>
        );
      })}
    </section>
  );
}
