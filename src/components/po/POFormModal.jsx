import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { listClients } from "../../services/clientService";
import {
  MONTHS,
  nextPONumber,
  todayISO,
  validatePO,
} from "../../services/poService";

function emptyForm() {
  const today = new Date();
  return {
    company: "",
    poNumber: "",
    dateAdded: todayISO(),
    month: MONTHS[today.getMonth()],
    totalCompounds: "",
    billedCompounds: "",
    amount: "",
    billNo: "",
    billLink: "",
    remarks: "",
  };
}

function formFromRecord(record) {
  return {
    company: record.company ?? "",
    poNumber: record.poNumber ?? "",
    dateAdded: record.dateAdded ?? "",
    month: record.month ?? "",
    totalCompounds: String(record.totalCompounds ?? ""),
    billedCompounds: String(record.billedCompounds ?? ""),
    amount: String(record.amount ?? ""),
    billNo: record.billNo ?? "",
    billLink: record.billLink ?? "",
    remarks: record.remarks ?? "",
  };
}

/** Searchable company picker (existing Clients list — no second database). */
function CompanyPicker({ value, invalid, onChange }) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  /* Keep the input in sync when the parent changes the selection (derived). */
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setQuery(value ?? "");
  }

  useEffect(() => {
    function onDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = listClients();
    return (q ? all.filter((c) => c.company.toLowerCase().includes(q)) : all).slice(0, 8);
  }, [query]);

  return (
    <div className="combo" ref={rootRef}>
      <div className={`combo-control${invalid ? " invalid" : ""}`}>
        <Search size={15} className="combo-lead" aria-hidden="true" />
        <input
          id="po-company"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="po-company-listbox"
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder="Search company..."
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && matches.length) {
              event.preventDefault();
              onChange(matches[0].company);
              setQuery(matches[0].company);
              setOpen(false);
            }
            if (event.key === "Escape") setOpen(false);
          }}
        />
      </div>
      {open && (
        <div className="combo-menu" role="listbox" id="po-company-listbox">
          {matches.length === 0 ? (
            <div className="combo-note">No matching companies.</div>
          ) : (
            matches.map((client) => (
              <button
                key={client.id}
                type="button"
                role="option"
                aria-selected={client.company === value}
                className={`combo-option${client.company === value ? " active" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(client.company);
                  setQuery(client.company);
                  setOpen(false);
                }}
              >
                <span className="combo-option-name">{client.company}</span>
                <span className="combo-option-meta">
                  {client.contact || "Contact not set"}
                  {client.address ? ` · ${client.address}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Shared Add / Edit purchase-order form (one modal, never two forms).
 * Validation is inline; the parent handles persistence + toasts.
 */
export default function POFormModal({ open, onClose, record, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [monthTouched, setMonthTouched] = useState(false);

  /* Reset whenever the modal opens (derived-state pattern: no effect). */
  const resetKey = open ? (record ? `edit:${record.id}` : "new") : null;
  const [prevResetKey, setPrevResetKey] = useState(null);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setErrors({});
    setFormError("");
    setSaving(false);
    setMonthTouched(Boolean(record));
    setForm(record ? formFromRecord(record) : emptyForm());
  }

  /* Auto-fill the PO number for new POs (async, after paint). */
  useEffect(() => {
    if (!open || record) return undefined;
    let cancelled = false;
    nextPONumber().then((result) => {
      if (!cancelled && result.ok) {
        setForm((current) =>
          current.poNumber ? current : { ...current, poNumber: result.poNumber }
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, record]);

  const patch = (changes) => setForm((current) => ({ ...current, ...changes }));

  function handleDateChange(dateAdded) {
    const changes = { dateAdded };
    if (!monthTouched && dateAdded) {
      const monthIndex = Number(dateAdded.slice(5, 7)) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        changes.month = MONTHS[monthIndex];
      }
    }
    patch(changes);
  }

  async function handleSubmit() {
    const validation = validatePO(form);
    setErrors(validation);
    if (!validation.valid) return;

    setSaving(true);
    setFormError("");
    const result = await onSubmit(form);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
    }
  }

  const fieldError = (key) =>
    errors[key] ? <p className="field-error">{errors[key]}</p> : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Edit Purchase Order" : "Add Purchase Order"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : record ? "Save Changes" : "Save PO"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="po-company">Company</label>
          <CompanyPicker
            value={form.company}
            invalid={Boolean(errors.company)}
            onChange={(company) => {
              patch({ company });
              setErrors((current) => ({ ...current, company: undefined }));
            }}
          />
          {fieldError("company")}
        </div>

        <div className="field">
          <label htmlFor="po-number">PO Number</label>
          <input
            id="po-number"
            value={form.poNumber}
            onChange={(event) => patch({ poNumber: event.target.value })}
            placeholder="PO-2026-001"
            aria-invalid={Boolean(errors.poNumber)}
          />
          {fieldError("poNumber")}
        </div>

        <div className="field">
          <label htmlFor="po-date">PO Date</label>
          <input
            id="po-date"
            type="date"
            value={form.dateAdded}
            onChange={(event) => handleDateChange(event.target.value)}
            aria-invalid={Boolean(errors.dateAdded)}
          />
          {fieldError("dateAdded")}
        </div>

        <div className="field">
          <label htmlFor="po-month">Month</label>
          <select
            id="po-month"
            value={form.month}
            onChange={(event) => {
              setMonthTouched(true);
              patch({ month: event.target.value });
            }}
          >
            {MONTHS.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
          <p className="field-hint">Auto-derived from PO date — editable.</p>
        </div>

        <div className="field">
          <label htmlFor="po-amount">Amount (₹)</label>
          <input
            id="po-amount"
            type="number"
            min="0"
            value={form.amount}
            onChange={(event) => patch({ amount: event.target.value })}
            placeholder="0"
            aria-invalid={Boolean(errors.amount)}
          />
          {fieldError("amount")}
        </div>

        <div className="field">
          <label htmlFor="po-total">Total Compounds</label>
          <input
            id="po-total"
            type="number"
            min="0"
            value={form.totalCompounds}
            onChange={(event) => patch({ totalCompounds: event.target.value })}
            placeholder="0"
            aria-invalid={Boolean(errors.totalCompounds)}
          />
          {fieldError("totalCompounds")}
        </div>

        <div className="field">
          <label htmlFor="po-billed">Billed Compounds</label>
          <input
            id="po-billed"
            type="number"
            min="0"
            value={form.billedCompounds}
            onChange={(event) => patch({ billedCompounds: event.target.value })}
            placeholder="0"
            aria-invalid={Boolean(errors.billedCompounds)}
          />
          {fieldError("billedCompounds")}
        </div>

        <div className="field">
          <label htmlFor="po-bill-no">Bill Number (optional)</label>
          <input
            id="po-bill-no"
            value={form.billNo}
            onChange={(event) => patch({ billNo: event.target.value })}
            placeholder="INV-001"
          />
        </div>

        <div className="field">
          <label htmlFor="po-bill-link">Bill Link (optional)</label>
          <input
            id="po-bill-link"
            value={form.billLink}
            onChange={(event) => patch({ billLink: event.target.value })}
            placeholder="https://..."
            aria-invalid={Boolean(errors.billLink)}
          />
          {fieldError("billLink")}
        </div>

        <div className="field full">
          <label htmlFor="po-remarks">Remarks</label>
          <textarea
            id="po-remarks"
            rows={3}
            value={form.remarks}
            onChange={(event) => patch({ remarks: event.target.value })}
            placeholder="Notes about this purchase order..."
          />
        </div>
      </div>

      {formError && (
        <p className="field-error" role="alert">
          {formError}
        </p>
      )}
      <p className="form-note">
        Status (Pending / Partial / Completed) is derived from billed vs total
        compounds automatically.
      </p>
    </Modal>
  );
}
