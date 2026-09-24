const TONES = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
  primary: "badge-primary",
};

export default function Badge({ tone = "neutral", dot = false, children }) {
  return (
    <span className={`badge ${TONES[tone] ?? TONES.neutral}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
