const STATUS_TONES = {
  /* Clients / CRM */
  New: "info",
  Active: "info",
  "Under Discussion": "warning",
  "Order Received": "success",
  "No Response": "neutral",
  Closed: "neutral",
  /* Bills / payments */
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
  Draft: "neutral",
  Saved: "success",
  /* Purchase orders (derived from billing progress) */
  Partial: "warning",
  /* Follow-ups */
  Scheduled: "info",
  Completed: "success",
  Rescheduled: "warning",
  Cancelled: "neutral",
  /* Products */
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger",
  /* Sync */
  Synced: "success",
  Syncing: "info",
  "Sync Failed": "danger",
  Offline: "neutral",
};

export function statusTone(status) {
  return STATUS_TONES[status] ?? "neutral";
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${statusTone(status)}`}>
      <span className="badge-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
