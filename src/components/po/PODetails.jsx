import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { Card, CardBody, CardHeader } from "../common/Card";
import Button from "../common/Button";
import Dropdown from "../common/Dropdown";
import EmptyState from "../common/EmptyState";
import POFilters from "./POFilters";
import POTable from "./POTable";

const PAGE_SIZES = [10, 25, 50, 100];

function getPageList(current, total) {
  const pages = [];
  for (let page = 1; page <= total; page += 1) {
    if (
      page === 1 ||
      page === total ||
      (page >= current - 1 && page <= current + 1)
    ) {
      pages.push(page);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

function LoadingSkeleton() {
  return (
    <div className="po-table-skeleton" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="po-table-skeleton-row">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
            <span key={cell} className="skeleton" style={{ height: 14 }} />
          ))}
        </div>
      ))}
      <span className="sr-only" role="status">Loading purchase orders…</span>
    </div>
  );
}

/**
 * PO Details section: toolbar, records table and pagination.
 * Filter/sort/page state is owned by the POManagement page so the
 * summary matrix can drive it.
 */
export default function PODetails({
  rows,
  total,
  filters,
  options,
  sort,
  onSort,
  onSearch,
  onPatch,
  onReset,
  onAdd,
  onAction,
  onExport,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
  readOnly = false,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const dirty =
    Boolean(filters.search) ||
    filters.company !== "All Companies" ||
    filters.month !== "All Months" ||
    filters.status !== "All Statuses";

  return (
    <Card className="table-card po-details-card">
      <CardHeader
        title="Purchase Order Details"
        subtitle="Manage individual purchase orders and billing progress"
        action={
          <Dropdown
            label="Export"
            options={["Export CSV"]}
            onSelect={onExport}
            align="right"
            ariaLabel="Export purchase orders"
          />
        }
      />
      <CardBody className="po-details-body">
        <POFilters
          filters={filters}
          options={options}
          onSearch={onSearch}
          onPatch={onPatch}
          onReset={onReset}
          onAdd={onAdd}
          dirty={dirty}
          readOnly={readOnly}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No purchase orders found"
            description={
              readOnly
                ? "Try changing your filters."
                : "Try changing your filters or create a new PO."
            }
            action={
              readOnly ? undefined : (
                <Button onClick={onAdd}>
                  + Add PO
                </Button>
              )
            }
          />
        ) : (
          <POTable
            rows={rows}
            sort={sort}
            onSort={onSort}
            onAction={onAction}
            readOnly={readOnly}
          />
        )}
      </CardBody>

      {!loading && total > 0 && (
        <div className="po-pagination">
          <span className="pagination-info">
            Showing {start}–{end} of {total} PO{total === 1 ? "" : "s"}
          </span>

          <div className="po-page-size">
            <label htmlFor="po-page-size">Rows</label>
            <select
              id="po-page-size"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="pagination-pages">
            <button
              type="button"
              className="page-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageList(currentPage, pageCount).map((entry, index) =>
              entry === "…" ? (
                <span key={`gap-${index}`} className="page-btn" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  className={`page-btn${entry === currentPage ? " active" : ""}`}
                  onClick={() => onPageChange(entry)}
                  aria-current={entry === currentPage ? "page" : undefined}
                >
                  {entry}
                </button>
              )
            )}
            <button
              type="button"
              className="page-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
