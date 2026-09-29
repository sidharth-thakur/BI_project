import { useEffect, useRef, useState } from "react";
import { CalendarClock, Clock3, MoreVertical, Phone, PhoneCall, XCircle } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import {
  daysSince,
  followLabel,
  formatDisplay,
  lastContactOf,
} from "../../services/callService";

const PRIORITY_LABEL = { High: "HIGH", Medium: "MEDIUM", Low: "LOW" };

/** Small View / Close-lead menu styled with the shared dropdown classes. */
function CardMenu({ customer, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${customer.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="dropdown-menu" role="menu">
          <button
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAction("view", customer);
            }}
          >
            View Customer 360
          </button>
          <button
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAction("reschedule", customer);
            }}
          >
            <CalendarClock size={15} /> Reschedule
          </button>
          <div className="dropdown-divider" />
          <button
            type="button"
            className="dropdown-item danger"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAction("close", customer);
            }}
          >
            <XCircle size={15} /> Close Lead
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * One customer in the call queue: priority dot, contact, key dates,
 * latest note and the core call actions.
 */
export default function CallCard({
  customer,
  variant = "standard",
  selected = false,
  onSelect,
  onLogCall,
  onReschedule,
  onAction,
}) {
  const follow = followLabel(customer.nextFollow, customer.nextFollowTime);
  const latestNote =
    customer.callHistory.find((entry) => entry.type === "call")?.notes ??
    customer.notes ??
    "";
  const since = daysSince(lastContactOf(customer));

  return (
    <article
      className={`call-card priority-${customer.priority.toLowerCase()}${
        selected ? " selected" : ""
      }`}
      onClick={() => onSelect(customer)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(customer);
        }
      }}
      aria-label={`Open ${customer.name}`}
    >
      <header className="call-card-head">
        <div className="call-card-title">
          <span
            className={`priority-dot ${customer.priority.toLowerCase()}`}
            aria-hidden="true"
          />
          <div>
            <p className="call-card-company">{customer.name}</p>
            <p className="call-card-contact">
              {customer.contact}
              {customer.dept ? ` · ${customer.dept}` : ""}
            </p>
          </div>
        </div>
        <span className={`priority-badge ${customer.priority.toLowerCase()}`}>
          {PRIORITY_LABEL[customer.priority] ?? customer.priority.toUpperCase()}
        </span>
      </header>

      {variant === "dormant" ? (
        <div className="call-card-dormant">
          <p>
            <Clock3 size={14} aria-hidden="true" /> Last interaction:{" "}
            <strong>{since !== null ? `${since} days ago` : "unknown"}</strong>
          </p>
          <p className="muted-line">No follow-up scheduled</p>
        </div>
      ) : (
        <dl className="call-card-meta">
          <div>
            <dt>Last Call</dt>
            <dd>{customer.lastCall ? formatDisplay(customer.lastCall) : "—"}</dd>
          </div>
          <div>
            <dt>Next Follow-up</dt>
            <dd className={`follow-${follow.tone}`}>{follow.text}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={customer.status} />
            </dd>
          </div>
        </dl>
      )}

      {latestNote && <p className="call-card-note">“{latestNote}”</p>}

      <footer
        className="call-card-actions"
        onClick={(event) => event.stopPropagation()}
      >
        {customer.phone ? (
          <a
            className="btn btn-accent btn-sm"
            href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
            aria-label={`Call ${customer.name}`}
          >
            <Phone size={14} /> Call
          </a>
        ) : (
          <span className="btn btn-accent btn-sm disabled" aria-disabled="true">
            <Phone size={14} /> No number
          </span>
        )}
        {variant === "dormant" ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onLogCall(customer)}
          >
            <CalendarClock size={14} /> Schedule Follow-up
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onLogCall(customer)}
            >
              <PhoneCall size={14} /> Log Call
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onReschedule(customer)}
            >
              Reschedule
            </button>
          </>
        )}
        <CardMenu customer={customer} onAction={onAction} />
      </footer>
    </article>
  );
}
