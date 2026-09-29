import { Card, CardBody, CardHeader } from "../common/Card";

const TERMS_OPTIONS = ["Advance", "30 Days", "45 Days", "60 Days", "Custom"];

/**
 * Payment & Delivery Terms card: terms select (with custom override),
 * delivery timeline and an additional-notes textarea.
 */
export default function PaymentTerms({ form, onChange }) {
  return (
    <Card>
      <CardHeader
        title="Payment & Delivery Terms"
        subtitle="Commercial conditions for this quotation"
      />
      <CardBody>
        <div className="terms-grid">
          <div className="field">
            <label htmlFor="payment-terms">Payment Terms</label>
            <select
              id="payment-terms"
              value={form.paymentTerms}
              onChange={(event) => onChange({ paymentTerms: event.target.value })}
            >
              {TERMS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {form.paymentTerms === "Custom" && (
            <div className="field">
              <label htmlFor="custom-terms">Custom Terms</label>
              <input
                id="custom-terms"
                value={form.customTerms ?? ""}
                onChange={(event) => onChange({ customTerms: event.target.value })}
                placeholder="e.g. 50% advance, 50% on delivery"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="delivery-timeline">Delivery Timeline</label>
            <input
              id="delivery-timeline"
              value={form.deliveryTimeline}
              onChange={(event) => onChange({ deliveryTimeline: event.target.value })}
              placeholder="e.g. 2–4 Weeks from order confirmation"
            />
          </div>

          <div className="field full">
            <label htmlFor="terms-notes">Notes</label>
            <textarea
              id="terms-notes"
              rows={3}
              value={form.termsNotes}
              onChange={(event) => onChange({ termsNotes: event.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
