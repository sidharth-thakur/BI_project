import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Card, CardBody, CardHeader } from "../common/Card";
import Button from "../common/Button";
import Modal from "../common/Modal";
import EmptyState from "../common/EmptyState";
import ProductRow from "./ProductRow";

/**
 * Products / Compounds card: dynamic, editable line-item table.
 * Serial numbers are index-based, so rows always renumber after deletion.
 */
export default function ProductTable({
  items,
  currency,
  errors = {},
  onChangeItem,
  onAddItem,
  onRemoveItem,
}) {
  const [pendingRemove, setPendingRemove] = useState(null);

  const rowErrors = errors.items ?? {};

  return (
    <>
      <Card>
        <CardHeader
          title="Products / Compounds"
          subtitle={
            items.length
              ? `${items.length} line item${items.length > 1 ? "s" : ""} in this quotation`
              : "Add products or compounds to this quotation"
          }
          action={
            <Button size="sm" onClick={onAddItem}>
              <Plus size={15} /> Add Product
            </Button>
          }
        />
        <CardBody className="items-card-body">
          {items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products added yet"
              description="Start adding products or compounds to build this quotation."
              action={
                <Button onClick={onAddItem}>
                  <Plus size={16} /> Add Product
                </Button>
              }
            />
          ) : (
            <div className="table-scroll items-scroll">
              <table className="items-table">
                <thead>
                  <tr>
                    <th className="col-index">#</th>
                    <th className="col-product">Product / Compound</th>
                    <th>HSN Code</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Timeline</th>
                    <th className="num">Unit Price</th>
                    <th className="num">Total</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <ProductRow
                      key={item.id}
                      item={item}
                      index={index}
                      currency={currency}
                      errors={rowErrors[item.id]}
                      onChange={(patch) => onChangeItem(item.id, patch)}
                      onRemove={() => setPendingRemove(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {errors.itemsList && (
            <p className="field-error items-error">{errors.itemsList}</p>
          )}

          {items.length > 0 && (
            <button type="button" className="add-row-btn" onClick={onAddItem}>
              <Plus size={15} aria-hidden="true" /> Add Product
            </button>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        title="Remove product row?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onRemoveItem(pendingRemove.id);
                setPendingRemove(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="text-muted">
          <strong>{pendingRemove?.desc || "This row"}</strong> will be removed
          from the quotation. Remaining rows will be renumbered automatically.
        </p>
      </Modal>
    </>
  );
}
