import StatusBadge from "../common/StatusBadge";
import { formatDisplay, followLabel } from "../../services/callService";

/**
 * Customer Overview definition list. Fields that don't exist in the data
 * render as "—" rather than fabricated values.
 */
export default function CustomerOverview({ customer }) {
  const follow = followLabel(customer.nextFollow, customer.nextFollowTime);

  return (
    <section className="crm-panel-section">
      <h3 className="crm-panel-heading">Customer Overview</h3>
      <dl className="crm-overview">
        <div>
          <dt>Company</dt>
          <dd>{customer.name}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>{customer.contact || "—"}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{customer.dept || "—"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={customer.status} />
          </dd>
        </div>
        <div>
          <dt>Last Inquiry</dt>
          <dd>{formatDisplay(customer.lastEnq)}</dd>
        </div>
        <div>
          <dt>Next Follow-up</dt>
          <dd className={`follow-${follow.tone}`}>
            {customer.nextFollow
              ? `${formatDisplay(customer.nextFollow)}${
                  customer.nextFollowTime ? ` · ${customer.nextFollowTime.slice(0, 5)}` : ""
                }`
              : "None scheduled"}
          </dd>
        </div>
        <div>
          <dt>Assigned To</dt>
          <dd>{customer.assignedTo || "—"}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <span className={`priority-badge ${customer.priority.toLowerCase()}`}>
              {customer.priority.toUpperCase()}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
