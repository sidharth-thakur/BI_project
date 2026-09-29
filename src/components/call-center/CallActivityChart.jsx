/** Compact weekly call-activity bar chart (last 7 days). */
export default function CallActivityChart({ data = [], loading = false }) {
  const max = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <section className="crm-chart-card" aria-label="Call activity">
      <header className="crm-chart-head">
        <h3>Call Activity</h3>
        <span className="crm-chart-sub">Calls · last 7 days</span>
      </header>

      {loading ? (
        <div className="crm-bars" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="crm-bar-col">
              <span className="skeleton" style={{ height: 20, width: "70%" }} />
              <span className="skeleton" style={{ height: 64, width: "70%" }} />
              <span className="skeleton" style={{ height: 11, width: "70%" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="crm-bars">
          {data.map((entry) => (
            <div key={entry.date} className="crm-bar-col">
              <span className="crm-bar-value">{entry.count}</span>
              <span
                className="crm-bar"
                style={{ height: `${Math.max(6, (entry.count / max) * 72)}px` }}
                title={`${entry.count} call${entry.count === 1 ? "" : "s"} on ${entry.day}`}
              />
              <span className="crm-bar-label">{entry.day}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
