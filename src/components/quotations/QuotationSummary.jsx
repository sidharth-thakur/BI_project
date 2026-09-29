import { Card, CardBody, CardHeader } from "../common/Card";
import { computeTotals, formatAmountExact } from "../../services/quotationService";

/**
 * Live price summary: subtotal, IGST (18%), freight and grand total.
 * USD quotations show clearly-labelled INR equivalents.
 */
export default function QuotationSummary({ form, errors, onFreightChange }) {
  const isUSD = form.currency === "USD";
  const totals = computeTotals(form);
  const showFreight = isUSD || totals.freight > 0;

  return (
    <Card>
      <CardHeader title="Price Summary" subtitle="Updates live as you edit" />
      <CardBody>
        <div className="field freight-field">
          <label htmlFor="quote-freight">Freight / DHL Charges</label>
          <div className={`price-input${isUSD ? "" : " disabled"}`}>
            <span aria-hidden="true">{isUSD ? "$" : "₹"}</span>
            <input
              id="quote-freight"
              type="number"
              min="0"
              step="any"
              value={form.freight}
              onChange={(event) => onFreightChange(event.target.value)}
              placeholder="0"
              disabled={!isUSD}
              readOnly={!isUSD}
              aria-readonly={!isUSD}
            />
          </div>
          <p className="field-hint">
            {isUSD
              ? "Applicable for USD / DHL quotations."
              : "Freight / DHL charges apply to USD quotations only."}
          </p>
        </div>

        <dl className="summary-list">
          <div className="summary-row">
            <dt>Subtotal</dt>
            <dd className="mono">{formatAmountExact(totals.subtotal, form.currency)}</dd>
          </div>
          <div className="summary-row">
            <dt>IGST (18%)</dt>
            <dd className="mono">{formatAmountExact(totals.tax, form.currency)}</dd>
          </div>
          {showFreight && (
            <div className="summary-row">
              <dt>Freight Charges</dt>
              <dd className="mono">
                {formatAmountExact(totals.freight, form.currency)}
              </dd>
            </div>
          )}
        </dl>

        <div className="summary-total">
          <div>
            <p className="summary-total-label">Grand Total</p>
            {isUSD && totals.inr && (
              <p className="summary-total-sub">
                INR Equivalent (1 USD = ₹{totals.inr.rate}) ≈{" "}
                <span className="mono">
                  {formatAmountExact(totals.inr.grandTotal, "INR")}
                </span>
              </p>
            )}
          </div>
          <p className="summary-total-value mono">
            {formatAmountExact(totals.grandTotal, form.currency)}
          </p>
        </div>

        {errors?.currency && <p className="field-error">{errors.currency}</p>}
      </CardBody>
    </Card>
  );
}
