export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p className="empty-desc">{label}</p>
    </div>
  );
}
