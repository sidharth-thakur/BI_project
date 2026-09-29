import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FileText, NotebookPen, ReceiptText } from "lucide-react";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import CallTimeline from "./CallTimeline";
import { listPOs, statusOf as poStatus, formatINR as formatPOINR } from "../../services/poService";
import { listQuotations, formatAmount } from "../../services/quotationService";
import { bills as allBills } from "../../data/billsData";
import { formatDisplay, addNote } from "../../services/callService";

/* Match a CRM company against another module's client/company name. */
function belongs(customerName, value) {
  if (!value) return false;
  const company = customerName.toLowerCase();
  const other = value.toLowerCase();
  return (
    company === other || company.startsWith(other) || other.startsWith(company)
  );
}

const TABS = [
  { key: "calls", label: "Calls" },
  { key: "quotations", label: "Quotations" },
  { key: "orders", label: "Purchase Orders" },
  { key: "bills", label: "Bills" },
  { key: "notes", label: "Notes" },
];

function ModuleSkeleton() {
  return (
    <div className="crm-module-skeleton" aria-hidden="true">
      {[0, 1].map((index) => (
        <div key={index} className="crm-module-row">
          <span className="skeleton" style={{ height: 14, width: "60%" }} />
          <span className="skeleton" style={{ height: 14, width: "35%" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Customer 360: Calls timeline, linked Quotations, Purchase Orders, Bills
 * and Notes — only real data from the application's modules.
 */
export default function Customer360({ customer, onNotify, onNoteAdded }) {
  const [tab, setTab] = useState("calls");
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [pos, setPos] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  /* Reset the 360 view when the customer changes (derived state). */
  const [prevCustomer, setPrevCustomer] = useState(customer.id);
  if (prevCustomer !== customer.id) {
    setPrevCustomer(customer.id);
    setTab("calls");
    setNoteText("");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadModules() {
      setLoading(true);
      const [quoteResult, poResult] = await Promise.all([
        listQuotations(),
        listPOs(),
      ]);
      if (cancelled) return;
      if (quoteResult.ok) setQuotations(quoteResult.items);
      else if (onNotify) {
        onNotify({ tone: "error", title: "Unable to load quotations", message: quoteResult.error });
      }
      if (poResult.ok) setPos(poResult.items);
      else if (onNotify) {
        onNotify({ tone: "error", title: "Unable to load purchase orders", message: poResult.error });
      }
      setLoading(false);
    }

    loadModules();
    return () => {
      cancelled = true;
    };
  }, [customer.id, onNotify]);

  const customerQuotations = quotations.filter((record) =>
    belongs(customer.name, record.client?.company)
  );
  const customerPOs = pos.filter((record) => belongs(customer.name, record.company));
  const customerBills = allBills.filter((bill) => belongs(customer.name, bill.client));

  async function saveNote() {
    setSavingNote(true);
    const result = await addNote(customer.id, noteText);
    setSavingNote(false);
    if (!result.ok) {
      onNotify?.({ tone: "error", title: "Unable to save note", message: result.error });
      return;
    }
    setNoteText("");
    onNoteAdded?.(result.record);
    onNotify?.({ tone: "success", title: "Note added", message: `${customer.name} updated.` });
  }

  return (
    <section className="crm-panel-section">
      <div className="crm-360-stats">
        <div>
          <span className="crm-360-label">Calls</span>
          <span className="crm-360-value">{customer.callHistory.length}</span>
        </div>
        <div>
          <span className="crm-360-label">Quotations</span>
          <span className="crm-360-value">{customerQuotations.length}</span>
        </div>
        <div>
          <span className="crm-360-label">Orders</span>
          <span className="crm-360-value">{customerPOs.length}</span>
        </div>
        <div>
          <span className="crm-360-label">Last Contact</span>
          <span className="crm-360-value small">
            {customer.lastCall ? formatDisplay(customer.lastCall) : "—"}
          </span>
        </div>
      </div>

      <div className="crm-360-tabs" role="tablist" aria-label="Customer 360 sections">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            className={`crm-360-tab${tab === entry.key ? " active" : ""}`}
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="crm-360-panel">
        {tab === "calls" && <CallTimeline entries={customer.callHistory} />}

        {tab === "quotations" &&
          (loading ? (
            <ModuleSkeleton />
          ) : customerQuotations.length === 0 ? (
            <p className="crm-panel-empty">
              No quotations yet for this customer.{" "}
              <Link to="/quotations/create">Create one</Link>
            </p>
          ) : (
            <>
              <ul className="crm-module-list">
                {customerQuotations.slice(0, 4).map((record) => (
                  <li key={record.id ?? record.number}>
                    <Link to={`/quotations/view/${record.number}`} className="crm-module-link">
                      <span className="crm-module-icon" aria-hidden="true">
                        <FileText size={14} />
                      </span>
                      <span className="crm-module-main">
                        <strong>{record.number}</strong>
                        <small>{formatAmount(record.totals?.grandTotal ?? 0, record.currency ?? "INR")}</small>
                      </span>
                      <StatusBadge status={record.status ?? "Saved"} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="crm-module-more" to="/quotations">
                View All Quotations
              </Link>
            </>
          ))}

        {tab === "orders" &&
          (loading ? (
            <ModuleSkeleton />
          ) : customerPOs.length === 0 ? (
            <p className="crm-panel-empty">No purchase orders for this customer yet.</p>
          ) : (
            <>
              <ul className="crm-module-list">
                {customerPOs.slice(0, 4).map((record) => (
                  <li key={record.id}>
                    <Link to="/po-management" className="crm-module-link">
                      <span className="crm-module-icon" aria-hidden="true">
                        <ClipboardList size={14} />
                      </span>
                      <span className="crm-module-main">
                        <strong>{record.poNumber}</strong>
                        <small>{formatPOINR(record.amount)}</small>
                      </span>
                      <StatusBadge status={poStatus(record)} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="crm-module-more" to="/po-management">
                View PO Management
              </Link>
            </>
          ))}

        {tab === "bills" &&
          (customerBills.length === 0 ? (
            <p className="crm-panel-empty">No bills for this customer yet.</p>
          ) : (
            <ul className="crm-module-list">
              {customerBills.slice(0, 5).map((bill) => (
                <li key={bill.id}>
                  <Link to="/bills" className="crm-module-link">
                    <span className="crm-module-icon" aria-hidden="true">
                      <ReceiptText size={14} />
                    </span>
                    <span className="crm-module-main">
                      <strong>{bill.billNo}</strong>
                      <small>{formatPOINR(bill.amount)}</small>
                    </span>
                    <StatusBadge status={bill.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ))}

        {tab === "notes" && (
          <div className="crm-notes">
            {customer.notes && <p className="crm-note-entry">{customer.notes}</p>}
            {(customer.noteLog ?? []).map((note) => (
              <p key={note.id} className="crm-note-entry dated">
                <span className="crm-note-date">{formatDisplay(note.date)}</span>
                {note.text}
              </p>
            ))}
            {!customer.notes && (customer.noteLog ?? []).length === 0 && (
              <p className="crm-panel-empty">No notes yet.</p>
            )}
            <div className="field crm-note-form">
              <label htmlFor="crm-note" className="sr-only">
                Add a note
              </label>
              <textarea
                id="crm-note"
                rows={3}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add a note about this customer..."
              />
              <div className="crm-note-actions">
                <Button
                  size="sm"
                  variant="accent"
                  onClick={saveNote}
                  disabled={savingNote || !noteText.trim()}
                >
                  <NotebookPen size={14} /> {savingNote ? "Saving..." : "Add Note"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
