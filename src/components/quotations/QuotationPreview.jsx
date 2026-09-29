import {
  computeTotals,
  formatAmountExact,
  formatDate,
} from "../../services/quotationService";

function paymentTermsOf(quotation) {
  if (quotation.paymentTerms && quotation.paymentTerms !== "Custom") {
    return quotation.paymentTerms;
  }
  return quotation.customTerms || quotation.paymentTerms || "—";
}

/**
 * Printable A4 quotation document. Takes a saved record or an unsaved
 * draft-shaped object; computes totals itself so it always matches the form.
 */
export default function QuotationPreview({ quotation }) {
  if (!quotation) return null;

  const currency = quotation.currency ?? "INR";
  const totals = computeTotals(quotation);
  const showFreight = currency === "USD" || totals.freight > 0;
  const items = quotation.items ?? [];
  const client = quotation.client ?? null;

  return (
    <article className="quote-doc quote-print-area">
      <header className="quote-doc-head">
        <div className="quote-doc-brand">
          <span className="quote-doc-mark" aria-hidden="true">
            V
          </span>
          <div>
            <p className="quote-doc-name">V BIOCHEM</p>
            <p className="quote-doc-sub">Advanced Software</p>
          </div>
        </div>
        <div className="quote-doc-title">
          <h2>QUOTATION</h2>
          <dl className="quote-doc-meta">
            <div>
              <dt>Quotation No</dt>
              <dd>{quotation.number || "—"}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDate(quotation.date)}</dd>
            </div>
            <div>
              <dt>Valid Until</dt>
              <dd>{formatDate(quotation.validUntil)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="quote-doc-to">
        <p className="quote-doc-label">TO</p>
        <p className="quote-doc-client">{client?.company ?? "—"}</p>
        {client?.contact && <p>{client.contact}</p>}
        {client?.address && <p>{client.address}</p>}
        {currency === "USD" && quotation.rate ? (
          <p className="quote-doc-rate">Exchange Rate: 1 USD = ₹{quotation.rate}</p>
        ) : null}
      </section>

      <table className="quote-doc-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product / Compound</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Timeline</th>
            <th className="num">Unit Price</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="quote-doc-empty">
                No products added.
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
              return (
                <tr key={item.id ?? index}>
                  <td>{index + 1}</td>
                  <td className="quote-doc-product">
                    {item.desc || "—"}
                    {item.unit ? <small> · {item.unit}</small> : null}
                  </td>
                  <td>{item.hsn || "—"}</td>
                  <td>{item.qty || 0}</td>
                  <td>{item.timeline || "—"}</td>
                  <td className="num">
                    {formatAmountExact(item.price, currency)}
                  </td>
                  <td className="num">{formatAmountExact(lineTotal, currency)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="quote-doc-bottom">
        <dl className="quote-doc-terms">
          <div>
            <dt>Payment Terms</dt>
            <dd>{paymentTermsOf(quotation)}</dd>
          </div>
          <div>
            <dt>Delivery Terms</dt>
            <dd>{quotation.deliveryTimeline || "—"}</dd>
          </div>
          {quotation.notes ? (
            <div>
              <dt>Notes</dt>
              <dd className="quote-doc-notes">{quotation.notes}</dd>
            </div>
          ) : null}
          {quotation.termsNotes ? (
            <div>
              <dt>Additional Notes</dt>
              <dd className="quote-doc-notes">{quotation.termsNotes}</dd>
            </div>
          ) : null}
        </dl>

        <dl className="quote-doc-totals">
          <div>
            <dt>Subtotal</dt>
            <dd className="mono">{formatAmountExact(totals.subtotal, currency)}</dd>
          </div>
          <div>
            <dt>IGST (18%)</dt>
            <dd className="mono">{formatAmountExact(totals.tax, currency)}</dd>
          </div>
          {showFreight && (
            <div>
              <dt>Freight</dt>
              <dd className="mono">{formatAmountExact(totals.freight, currency)}</dd>
            </div>
          )}
          {currency === "USD" && totals.inr && (
            <div className="quote-doc-inr">
              <dt>INR Equivalent</dt>
              <dd className="mono">
                {formatAmountExact(totals.inr.grandTotal, "INR")}
              </dd>
            </div>
          )}
          <div className="quote-doc-grand">
            <dt>GRAND TOTAL</dt>
            <dd className="mono">{formatAmountExact(totals.grandTotal, currency)}</dd>
          </div>
        </dl>
      </div>

      <footer className="quote-doc-footer">
        <div>
          <p className="quote-doc-label">Authorized By</p>
          <p className="quote-doc-sign">Signature &amp; Stamp</p>
        </div>
        <div className="quote-doc-footer-right">
          <p className="quote-doc-label">For V BIOCHEM</p>
          <p className="quote-doc-sign">Authorized Signatory</p>
        </div>
      </footer>

      <p className="quote-doc-fineprint">
        This quotation is computer generated by V BIOCHEM Advanced Software.
      </p>
    </article>
  );
}
