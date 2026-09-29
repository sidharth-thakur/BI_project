import { Trash2 } from "lucide-react";
import ProductAutocomplete from "./ProductAutocomplete";
import { formatAmount } from "../../services/quotationService";

const UNIT_OPTIONS = ["Kg", "g", "mg", "L", "ml", "pcs", "packs", "boxes", "unit"];

/**
 * One editable product row. Serial number comes from the row index, so it
 * always renumbers after deletions. Total = Qty × Unit Price, live.
 */
export default function ProductRow({
  item,
  index,
  currency,
  errors = {},
  onChange,
  onRemove,
}) {
  const qty = Number(item.qty);
  const price = Number(item.price);
  const total =
    Number.isFinite(qty) && Number.isFinite(price) && qty > 0 ? qty * price : 0;

  const symbol = currency === "USD" ? "$" : "₹";

  return (
    <tr>
      <td className="cell-index">{index + 1}</td>

      <td className="cell-product">
        <ProductAutocomplete
          id={`product-${item.id}`}
          value={item.desc}
          currency={currency}
          invalid={Boolean(errors.desc)}
          onChangeText={(text) => onChange({ desc: text })}
          onSelect={(product) =>
            onChange({
              desc: product.name,
              hsn: product.hsn,
              timeline: product.timeline,
              price: product.price,
              unit: product.unit,
              productId: product.id,
            })
          }
        />
        {errors.desc && <p className="field-error">{errors.desc}</p>}
      </td>

      <td>
        <input
          className="cell-input"
          value={item.hsn}
          onChange={(event) => onChange({ hsn: event.target.value })}
          placeholder="0000"
          aria-label={`HSN code for row ${index + 1}`}
        />
      </td>

      <td>
        <input
          className={`cell-input narrow${errors.qty ? " invalid" : ""}`}
          type="number"
          min="0"
          step="any"
          value={item.qty}
          onChange={(event) => onChange({ qty: event.target.value })}
          placeholder="0"
          aria-label={`Quantity for row ${index + 1}`}
          aria-invalid={Boolean(errors.qty)}
        />
        {errors.qty && <p className="field-error">{errors.qty}</p>}
      </td>

      <td>
        <select
          className="cell-input"
          value={item.unit}
          onChange={(event) => onChange({ unit: event.target.value })}
          aria-label={`Unit for row ${index + 1}`}
        >
          {UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </td>

      <td>
        <input
          className="cell-input"
          value={item.timeline}
          onChange={(event) => onChange({ timeline: event.target.value })}
          placeholder="2–4 Weeks"
          aria-label={`Timeline for row ${index + 1}`}
        />
      </td>

      <td>
        <div className={`price-input${errors.price ? " invalid" : ""}`}>
          <span aria-hidden="true">{symbol}</span>
          <input
            type="number"
            min="0"
            step="any"
            value={item.price}
            onChange={(event) => onChange({ price: event.target.value })}
            placeholder="0"
            aria-label={`Unit price for row ${index + 1}`}
            aria-invalid={Boolean(errors.price)}
          />
        </div>
        {errors.price && <p className="field-error">{errors.price}</p>}
      </td>

      <td className="cell-total mono">{formatAmount(total, currency)}</td>

      <td>
        <button
          type="button"
          className="icon-btn cell-remove"
          onClick={onRemove}
          aria-label={`Remove ${item.desc || `row ${index + 1}`}`}
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
