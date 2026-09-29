import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import {
  addDays,
  followLabel,
  formatDisplay,
  formatTime,
  todayISO,
} from "../../services/callService";

/**
 * Reschedule Follow-up modal: shows the current appointment, accepts a new
 * date/time and a reason, and records the change in the call history.
 */
export default function RescheduleModal({ open, customer, onClose, onSave }) {
  const [form, setForm] = useState({ date: "", time: "10:00", reason: "" });
  const [resetKey, setResetKey] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const key = open ? (customer?.id ?? null) : null;
  if (key !== resetKey) {
    setResetKey(key);
    setForm({
      date: customer?.nextFollow || addDays(todayISO(), 1),
      time: customer?.nextFollowTime || "10:00",
      reason: "",
    });
    setError("");
    setSaving(false);
  }

  async function handleSave() {
    if (!form.date) {
      setError("New date is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await onSave(customer, form);
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  const current = customer
    ? customer.nextFollow
      ? `${formatDisplay(customer.nextFollow)}${
          customer.nextFollowTime ? ` · ${formatTime(customer.nextFollowTime)}` : ""
        }`
      : "None scheduled"
    : "";

  /* Relative badge (TODAY / OVERDUE / Tomorrow) beside the absolute date. */
  const follow = customer?.nextFollow
    ? followLabel(customer.nextFollow, customer.nextFollowTime)
    : null;
  const relative = follow ? follow.text.split(" · ")[0] : "";
  const showRelative = follow && ["TODAY", "OVERDUE", "Tomorrow"].includes(relative);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule Follow-up"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Reschedule"}
          </Button>
        </>
      }
    >
      {customer && (
        <>
          <p className="reschedule-current">
            <span>Current:</span> <strong>{current}</strong>
            {showRelative && (
              <span className={`follow-chip tone-${follow.tone}`}>{relative}</span>
            )}
          </p>
          <p className="reschedule-customer">
            {customer.name} · {customer.contact}
          </p>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="res-date">New Date</label>
              <input
                id="res-date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, date: event.target.value }))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="res-time">New Time</label>
              <input
                id="res-time"
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, time: event.target.value }))
                }
              />
            </div>
            <div className="field full">
              <label htmlFor="res-reason">Reason</label>
              <input
                id="res-reason"
                value={form.reason}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, reason: event.target.value }))
                }
                placeholder="e.g. Customer requested later call"
              />
            </div>
          </div>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
