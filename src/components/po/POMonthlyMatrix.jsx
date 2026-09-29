import { memo } from "react";
import { formatINR, formatLakh, MONTHS } from "../../services/poService";

/**
 * Company × Jan–Dec matrix. Values, row totals, column totals and the
 * grand total are all computed by poService from the PO records.
 * Clicking a non-zero cell drills into PO Details filtered to that
 * company + month + year.
 */
function POMonthlyMatrix({ matrix, onCellClick }) {
  return (
    <div className="po-matrix-scroll">
      <table className="po-matrix">
        <thead>
          <tr>
            <th className="col-company">Company</th>
            {MONTHS.map((month) => (
              <th key={month}>{month}</th>
            ))}
            <th className="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.company}>
              <th scope="row" className="col-company">
                {row.company}
              </th>
              {row.values.map((value, index) => (
                <td key={MONTHS[index]} className={value > 0 ? "has-value" : ""}>
                  {value > 0 ? (
                    <button
                      type="button"
                      className="po-cell"
                      title={`${row.company} · ${MONTHS[index]} ${matrix.year} · ${formatINR(value)} — view POs`}
                      aria-label={`View ${row.company} purchase orders for ${MONTHS[index]} ${matrix.year}`}
                      onClick={() => onCellClick(row.company, index)}
                    >
                      {formatLakh(value)}
                    </button>
                  ) : (
                    <span className="po-cell-zero">0</span>
                  )}
                </td>
              ))}
              <td className="col-total mono">{formatLakh(row.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="col-company">TOTAL</th>
            {matrix.totals.map((value, index) => (
              <td key={MONTHS[index]} className="mono">
                {formatLakh(value)}
              </td>
            ))}
            <td className="col-total mono">{formatLakh(matrix.grand)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default memo(POMonthlyMatrix);
