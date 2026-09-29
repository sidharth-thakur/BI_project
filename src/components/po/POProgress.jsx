import { progressOf } from "../../services/poService";

const TONE_BY_STATUS = {
  Completed: "complete",
  Partial: "partial",
  Pending: "pending",
};

/**
 * Billing progress: "8 / 15" plus a subtle bar and percentage.
 * Derived from totalCompounds vs billedCompounds.
 */
export default function POProgress({ po, compact = false }) {
  const { billed, total, percent, status } = progressOf(po);
  const tone = TONE_BY_STATUS[status] ?? "pending";

  return (
    <div className={`po-progress tone-${tone}${compact ? " compact" : ""}`}>
      <span className="po-progress-count mono">
        {billed} / {total}
      </span>
      <div
        className="po-progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Billing progress: ${billed} of ${total} compounds billed`}
      >
        <span className="po-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="po-progress-pct mono">{percent}%</span>
    </div>
  );
}
