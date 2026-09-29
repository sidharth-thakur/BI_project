import { Card, CardBody, CardHeader } from "../common/Card";

/**
 * Quotation Details card: number, dates, currency and exchange rate.
 * Exchange rate is read-only (1.00) for INR and editable for USD.
 */
export default function QuotationDetails({
  form,
  onChange,
  errors,
  numberLoading = false,
}) {
  const isUSD = form.currency === "USD";

  return (
    <Card>
      <CardHeader
        title="Quotation Details"
        subtitle="Reference number, validity and currency"
      />
      <CardBody>
        <div className="quote-details-grid">
          <div className="field">
            <label htmlFor="quote-number">Quotation Number</label>
            {numberLoading ? (
              <span className="skeleton" style={{ height: 38, borderRadius: 16 }} />
            ) : (
              <input
                id="quote-number"
                value={form.number}
                onChange={(event) => onChange({ number: event.target.value })}
                placeholder="VBQ-2026-001"
                aria-invalid={Boolean(errors.number)}
              />
            )}
            {errors.number ? (
              <p className="field-error">{errors.number}</p>
            ) : (
              <p className="field-hint">Auto-generated — editable if needed.</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="quote-date">Quotation Date</label>
            <input
              id="quote-date"
              type="date"
              value={form.date}
              onChange={(event) => onChange({ date: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="quote-valid-until">Valid Until</label>
            <input
              id="quote-valid-until"
              type="date"
              value={form.validUntil}
              onChange={(event) => onChange({ validUntil: event.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="quote-currency">Currency</label>
            <select
              id="quote-currency"
              value={form.currency}
              onChange={(event) => onChange({ currency: event.target.value })}
              aria-invalid={Boolean(errors.currency)}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
            {errors.currency && <p className="field-error">{errors.currency}</p>}
          </div>

          <div className="field">
            <label htmlFor="quote-rate">Exchange Rate</label>
            {isUSD ? (
              <div className="input-prefix-group">
                <span className="input-prefix">1 USD = ₹</span>
                <input
                  id="quote-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={(event) => onChange({ rate: event.target.value })}
                  aria-label="Exchange rate: 1 USD in INR"
                />
              </div>
            ) : (
              <input id="quote-rate" value="1.00" readOnly aria-readonly="true" />
            )}
            <p className="field-hint">
              {isUSD
                ? "Editable — used for INR equivalents."
                : "Base currency — fixed at 1.00."}
            </p>
          </div>

          <div className="field">
            <label>Quotation Currency</label>
            <div className="currency-pill-row" role="status">
              <span
                className={`currency-pill${form.currency === "INR" ? " active" : ""}`}
              >
                INR (₹)
              </span>
              <span
                className={`currency-pill${form.currency === "USD" ? " active" : ""}`}
              >
                USD ($)
              </span>
            </div>
            <p className="field-hint">
              {isUSD
                ? `Prices shown in $ · 1 USD = ₹${form.rate || 83.2}`
                : "Prices shown in ₹ throughout."}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
