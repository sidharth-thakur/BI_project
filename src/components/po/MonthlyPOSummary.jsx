import { ClipboardList, Printer } from "lucide-react";
import { Card, CardBody, CardHeader } from "../common/Card";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import EmptyState from "../common/EmptyState";
import POMonthlyMatrix from "./POMonthlyMatrix";

/**
 * Monthly PO Summary card: year / company filters, export menu and the
 * computed company-by-month matrix.
 */
export default function MonthlyPOSummary({
  year,
  years,
  onYearChange,
  company,
  companies,
  onCompanyChange,
  matrix,
  loading = false,
  onCellClick,
  onExport,
}) {
  return (
    <Card className="po-print-area">
      <CardHeader
        title="Monthly PO Summary"
        subtitle={
          matrix.rows.length
            ? `${matrix.rows.length} compan${matrix.rows.length === 1 ? "y" : "ies"} · ${matrix.year} · values computed from live PO records`
            : `Company-wise PO value by month · ${matrix.year}`
        }
        action={
          <div className="po-header-actions">
            <Dropdown
              label={`Company: ${company}`}
              value={`Company: ${company}`}
              options={companies}
              onSelect={onCompanyChange}
              align="right"
              ariaLabel="Filter by company"
            />
            <Dropdown
              label={`Year: ${year}`}
              value={`Year: ${year}`}
              options={years}
              onSelect={onYearChange}
              align="right"
              ariaLabel="Filter by year"
            />
            <Dropdown
              label="Export"
              options={["Export CSV", "Print Summary"]}
              onSelect={onExport}
              align="right"
              ariaLabel="Export options"
            />
          </div>
        }
      />
      <CardBody>
        {loading ? (
          <div className="po-matrix-skeleton" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="po-matrix-skeleton-row">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((cell) => (
                  <span key={cell} className="skeleton" style={{ height: 14 }} />
                ))}
              </div>
            ))}
          </div>
        ) : matrix.rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No PO data available"
            description={`There are no purchase orders for ${company !== "All Companies" ? `${company} in ` : ""}the selected year.`}
            action={
              company !== "All Companies" ? (
                <Button variant="secondary" onClick={() => onCompanyChange("All Companies")}>
                  Clear company filter
                </Button>
              ) : null
            }
          />
        ) : (
          <POMonthlyMatrix matrix={matrix} onCellClick={onCellClick} />
        )}
      </CardBody>
      {loading && (
        <span className="sr-only" role="status">Loading monthly summary…</span>
      )}
      {!loading && matrix.rows.length > 0 && (
        <div className="po-export-hint no-print" aria-hidden="true">
          <Printer size={13} />
          <span>Click a month value to open the PO records behind it.</span>
        </div>
      )}
    </Card>
  );
}
