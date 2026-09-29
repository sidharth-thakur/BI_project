/** Horizontal bar chart of logged call outcomes. */
export default function OutcomeChart({ data = [], loading = false }) {
  const max = Math.max(1, ...data.map((entry) => entry.count));

  return (
    <section className="crm-chart-card" aria-label="Call outcomes">
      <header className="crm-chart-head">
        <h3>Call Outcomes</h3>
        <span className="crm-chart-sub">Distribution</span>
      </header>

      {loading ? (
        <div className="crm-hbars" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="crm-hbar-row">
              <span className="skeleton" style={{ height: 12, width: "38%" }} />
              <span className="skeleton" style={{ height: 10, width: "55%" }} />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="crm-panel-empty">No calls logged yet.</p>
      ) : (
        <div className="crm-hbars">
          {data.map((entry) => (
            <div key={entry.outcome} className="crm-hbar-row">
              <span className="crm-hbar-label" title={entry.outcome}>
                {entry.outcome}
              </span>
              <span className="crm-hbar-track">
                <span
                  className="crm-hbar-fill"
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </span>
              <span className="crm-hbar-count mono">{entry.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
