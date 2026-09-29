import { formatDisplay, formatTime } from "../../services/callService";

const OUTCOME_TONE = {
  Connected: "success",
  Interested: "success",
  "Order Expected": "success",
  "Quotation Requested": "info",
  "Follow-up Required": "warning",
  Busy: "warning",
  "No Answer": "muted",
  "Wrong Number": "muted",
  "Not Interested": "danger",
  Closed: "danger",
};

function titleFor(entry) {
  if (entry.type === "created") return "Lead Created";
  if (entry.type === "reschedule") return "Follow-up Rescheduled";
  if (entry.type === "close") return "Lead Closed";
  if (entry.type === "legacy") return entry.outcome;
  return entry.outcome;
}

/**
 * Vertical call-history timeline — the strongest visual in the panel.
 */
export default function CallTimeline({ entries = [], emptyMessage = "No calls logged yet." }) {
  if (!entries.length) {
    return <p className="crm-panel-empty">{emptyMessage}</p>;
  }

  return (
    <ol className="crm-timeline">
      {entries.map((entry) => (
        <li key={entry.id} className={`timeline-item type-${entry.type ?? "call"}`}>
          <span className="timeline-node" aria-hidden="true" />
          <div className="timeline-body">
            <p className="timeline-when">
              {formatDisplay(entry.date)}
              {entry.time ? ` · ${formatTime(entry.time)}` : ""}
            </p>
            <p className="timeline-title">{titleFor(entry)}</p>
            {entry.type === "call" ? (
              <span className={`outcome-chip tone-${OUTCOME_TONE[entry.outcome] ?? "muted"}`}>
                Outcome: {entry.outcome}
              </span>
            ) : null}
            {entry.notes && <p className="timeline-note">{entry.notes}</p>}
            {entry.nextFollow && (
              <p className="timeline-next">
                Next follow-up → {formatDisplay(entry.nextFollow)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
