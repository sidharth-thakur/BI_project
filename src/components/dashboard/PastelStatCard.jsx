import MiniTrend from "./MiniTrend";

const TONES = {
  green: "kpi-green",
  cyan: "kpi-cyan",
  pink: "kpi-pink",
  purple: "kpi-purple",
};

export default function PastelStatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <article className={`kpi-card ${TONES[stat.tone] ?? "kpi-green"}`}>
      <div className="kpi-top">
        <span className="kpi-label">
          <span className="kpi-icon" aria-hidden="true">
            <Icon size={16} strokeWidth={2.1} />
          </span>
          {stat.label}
        </span>
        <MiniTrend points={stat.trend} />
      </div>

      <div className="kpi-value">{stat.value}</div>

      <div className="kpi-growth">
        <span className="kpi-growth-pill">{stat.growth}</span>
        <span className="kpi-note">{stat.note}</span>
      </div>
    </article>
  );
}
