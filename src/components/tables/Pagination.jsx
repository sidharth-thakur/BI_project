import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function Pagination({
  page,
  pageCount,
  totalItems,
  onPageChange,
  itemLabel = "records",
}) {
  if (pageCount <= 1) {
    return (
      <div className="pagination">
        <span className="pagination-info">
          {totalItems} {itemLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Page {page} of {pageCount} · {totalItems} {itemLabel}
      </span>
      <div className="pagination-pages">
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {getPageList(page, pageCount).map((entry, index) =>
          entry === "…" ? (
            <span key={`gap-${index}`} className="page-btn" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={`page-btn${entry === page ? " active" : ""}`}
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </button>
          )
        )}
        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
