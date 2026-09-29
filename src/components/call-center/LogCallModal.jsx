import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import {
  CALL_OUTCOMES,
  FOLLOWUP_OPTIONS,
  currentTimeHHMM,
  todayISO,
} from "../../services/callService";

function defaultForm(customer) {
  return {
    companyId: customer?.id ?? "",
    date: todayISO(),
    time: currentTimeHHMM(),
    outcome: "Connected",
    notes: "",
    followChoice: "Tomorrow",
    followDate: "",
    followTime: "10:00",
  };
}

/**
 * Log Call modal: company/contact (auto-selected or pickable), date/time,
 * configurable outcome list, large notes area and next-follow-up planning.
 * One modal serves the header CTA and every per-customer action.
 */
export default function LogCallModal({
  open,
  customer,
  customers = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => defaultForm(customer));
  const [resetKey, setResetKey] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /* Reset whenever the modal opens for a different customer. */
  const key = open ? (customer?.id ?? "pick") : null;
  if (key !== resetKey) {
    setResetKey(key);
    setForm(defaultForm(customer));
    setError("");
    setSaving(false);
  }

  const selected =
    customer ?? customers.find((entry) => entry.id === form.companyId) ?? null;

  const patch = (changes) => setForm((current) => ({ ...current, ...changes }));

  async function handleSave() {
    if (!selected) {
      setError("Select a company.");
      return;
    }
    if (!form.date) {
      setError("Call date is required.");
      return;
    }
    if (form.followChoice === "Custom Date" && !form.followDate) {
      setError("Select a follow-up date.");
      return;
    }

    setSaving(true);
    setError("");
    const result = await onSave(selected, form);
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  const showFollowTime = form.followChoice !== "No Follow-up";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Call"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Call"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        {customer ? (
          <>
            <div className="field">
              <label>Company</label>
              <input value={customer.name} readOnly aria-readonly="true" />
            </div>
            <div className="field">
              <label>Contact Person</label>
              <input value={customer.contact || "—"} readOnly aria-readonly="true" />
            </div>
          </>
        ) : (
          <div className="field full">
            <label htmlFor="log-company">Company</label>
            <select
              id="log-company"
              value={form.companyId}
              onChange={(event) => patch({ companyId: event.target.value })}
            >
              <option value="">Search company...</option>
              {customers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {entry.contact}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="log-date">Call Date</label>
          <input
            id="log-date"
            type="date"
            value={form.date}
            onChange={(event) => patch({ date: event.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="log-time">Call Time</label>
          <input
            id="log-time"
            type="time"
            value={form.time}
            onChange={(event) => patch({ time: event.target.value })}
          />
        </div>

        <div className="field full">
          <label htmlFor="log-outcome">Call Outcome</label>
          <select
            id="log-outcome"
            value={form.outcome}
            onChange={(event) => patch({ outcome: event.target.value })}
          >
            {CALL_OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label htmlFor="log-notes">Call Notes</label>
          <textarea
            id="log-notes"
            rows={5}
            value={form.notes}
            onChange={(event) => patch({ notes: event.target.value })}
            placeholder="What happened during the call?"
          />
        </div>

        <div className="field">
          <label htmlFor="log-follow">Next Follow-up</label>
          <select
            id="log-follow"
            value={form.followChoice}
            onChange={(event) => patch({ followChoice: event.target.value })}
          >
            {FOLLOWUP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {form.followChoice === "Custom Date" && (
          <div className="field">
            <label htmlFor="log-follow-date">Follow-up Date</label>
            <input
              id="log-follow-date"
              type="date"
              value={form.followDate}
              onChange={(event) => patch({ followDate: event.target.value })}
            />
          </div>
        )}

        {showFollowTime && (
          <div className="field">
            <label htmlFor="log-follow-time">Follow-up Time</label>
            <input
              id="log-follow-time"
              type="time"
              value={form.followTime}
              onChange={(event) => patch({ followTime: event.target.value })}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="form-note">
        Saving updates the call history, follow-up date, customer status and
        dashboard counters.
      </p>
    </Modal>
  );
}
