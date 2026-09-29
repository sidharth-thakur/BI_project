import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { CLOSE_REASONS } from "../../services/callService";

/**
 * Close-lead confirmation modal. The customer leaves the active queues but
 * all historical call information is preserved.
 */
export default function CloseLeadModal({ open, customer, onClose, onConfirm }) {
  const [reason, setReason] = useState(CLOSE_REASONS[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [resetKey, setResetKey] = useState(null);
  const key = open ? (customer?.id ?? null) : null;
  if (key !== resetKey) {
    setResetKey(key);
    setReason(CLOSE_REASONS[0]);
    setError("");
    setSaving(false);
  }

  async function handleConfirm() {
    setSaving(true);
    setError("");
    const result = await onConfirm(customer, reason);
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Close this lead?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={saving}>
            {saving ? "Closing..." : "Close Lead"}
          </Button>
        </>
      }
    >
      {customer && (
        <>
          <p className="text-muted">
            <strong>{customer.name}</strong> will be removed from active
            follow-ups.
          </p>
          <p className="text-muted">This action cannot be undone.</p>

          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="close-reason">Reason</label>
            <select
              id="close-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {CLOSE_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
