import { Card, CardBody, CardHeader } from "../common/Card";

/**
 * Notes / Special Instructions card. Multi-line free text shown on the
 * printed quotation document.
 */
export default function QuotationNotes({ value, onChange }) {
  return (
    <Card>
      <CardHeader
        title="Notes / Special Instructions"
        subtitle="Printed on the quotation document"
      />
      <CardBody>
        <div className="field">
          <label htmlFor="quotation-notes" className="sr-only">
            Notes / Special Instructions
          </label>
          <textarea
            id="quotation-notes"
            rows={4}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              "Prices are subject to applicable taxes.\nDelivery timeline will be confirmed after order confirmation."
            }
          />
        </div>
      </CardBody>
    </Card>
  );
}
