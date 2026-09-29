import { Mail, Phone, PhoneCall, CalendarClock, UserRound } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Button from "../common/Button";
import CustomerOverview from "./CustomerOverview";
import Customer360 from "./Customer360";
import { followLabel } from "../../services/callService";

function PanelSkeleton() {
  return (
    <div className="crm-panel-skeleton" aria-hidden="true">
      <span className="skeleton" style={{ height: 46, width: "70%" }} />
      <span className="skeleton" style={{ height: 16, width: "45%" }} />
      <span className="skeleton" style={{ height: 120, width: "100%" }} />
      <span className="skeleton" style={{ height: 140, width: "100%" }} />
      <span className="sr-only" role="status">Loading customer…</span>
    </div>
  );
}

/**
 * Right-side CRM panel: customer identity, quick actions,
 * overview and the Customer 360 sections.
 */
export default function CustomerPanel({
  customer,
  loading = false,
  onLogCall,
  onReschedule,
  onNotify,
  onNoteAdded,
}) {
  if (loading) return <PanelSkeleton />;

  if (!customer) {
    return (
      <EmptyState
        icon={UserRound}
        title="Select a customer"
        description="Click a customer in the call queue to see their contact details, call history and linked quotations or orders."
      />
    );
  }

  const follow = followLabel(customer.nextFollow, customer.nextFollowTime);

  return (
    <div className="crm-panel">
      <header className="crm-panel-head">
        <span className="avatar lg" aria-hidden="true">
          {customer.initials}
        </span>
        <div className="crm-panel-id">
          <p className="crm-panel-company">{customer.name}</p>
          <p className="crm-panel-person">
            {customer.contact || "Contact not set"}
            {customer.dept ? ` · ${customer.dept}` : ""}
          </p>
          <div className="crm-panel-chips">
            <StatusBadge status={customer.status} />
            <span className={`priority-badge ${customer.priority.toLowerCase()}`}>
              {customer.priority.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="crm-contact-lines">
        {customer.phone ? (
          <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} title={customer.phone}>
            <Phone size={14} aria-hidden="true" /> {customer.phone}
          </a>
        ) : (
          <span className="disabled-line">
            <Phone size={14} aria-hidden="true" /> No phone number
          </span>
        )}
        {customer.email ? (
          <a href={`mailto:${customer.email}`}>
            <Mail size={14} aria-hidden="true" /> {customer.email}
          </a>
        ) : (
          <span className="disabled-line">
            <Mail size={14} aria-hidden="true" /> No email
          </span>
        )}
        <span className={`crm-follow-line follow-${follow.tone}`}>
          <CalendarClock size={14} aria-hidden="true" /> Next Follow-up: {follow.text}
        </span>
      </div>

      <div className="crm-quick-actions">
        {customer.phone ? (
          <a
            className="btn btn-accent btn-sm"
            href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}
          >
            <Phone size={14} /> Call
          </a>
        ) : (
          <span className="btn btn-accent btn-sm disabled" aria-disabled="true">
            <Phone size={14} /> Call
          </span>
        )}
        {customer.email ? (
          <a className="btn btn-secondary btn-sm" href={`mailto:${customer.email}`}>
            <Mail size={14} /> Email
          </a>
        ) : (
          <span className="btn btn-secondary btn-sm disabled" aria-disabled="true">
            <Mail size={14} /> Email
          </span>
        )}
        <Button size="sm" variant="secondary" onClick={() => onLogCall(customer)}>
          <PhoneCall size={14} /> Log Call
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReschedule(customer)}>
          <CalendarClock size={14} /> Schedule
        </Button>
      </div>

      <CustomerOverview customer={customer} />

      <Customer360
        customer={customer}
        onNotify={onNotify}
        onNoteAdded={onNoteAdded}
      />
    </div>
  );
}
