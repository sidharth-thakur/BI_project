import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import POProgress from "./POProgress";
import {
  formatINR,
  formatDate,
  progressOf,
  statusOf,
} from "../../services/poService";

function useIsNarrow(breakpoint = 900) {
  const query = `(max-width: ${breakpoint}px)`;
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setNarrow(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}

/** Per-row View / Edit / Delete menu (styled with the shared dropdown classes). */
function RowMenu({ po, onAction, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${po.poNumber}`}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="dropdown-menu" role="menu">
          <button
            type="button"
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAction("View", po);
            }}
          >
            <Eye size={15} /> View
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                className="dropdown-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onAction("Edit", po);
                }}
              >
                <Pencil size={15} /> Edit
              </button>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item danger"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onAction("Delete", po);
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      className={column.align === "right" ? "num" : undefined}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={`po-th${active ? " active" : ""}`}
        onClick={() => onSort(column.key)}
      >
        {column.label}
        <Icon size={12} aria-hidden="true" />
      </button>
    </th>
  );
}

const COLUMNS = [
  { key: "poNumber", label: "PO Number", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "month", label: "Month" },
  { key: "dateAdded", label: "PO Date", sortable: true },
  { key: "totalCompounds", label: "Total Comp", sortable: true, align: "right" },
  { key: "billedCompounds", label: "Billed", sortable: true, align: "right" },
  { key: "progress", label: "Progress", sortable: true },
  { key: "amount", label: "Amount", sortable: true, align: "right" },
  { key: "billNo", label: "Bill No." },
  { key: "status", label: "Status" },
  { key: "remarks", label: "Remarks" },
];

/**
 * PO records table. Desktop: full sortable table with a row action menu.
 * Mobile (≤900px): the same records render as cards.
 */
export default function POTable({ rows, sort, onSort, onAction, readOnly = false }) {
  const narrow = useIsNarrow();

  if (narrow) {
    return (
      <ul className="po-cards">
        {rows.map((po) => (
          <li key={po.id} className="po-card">
            <div className="po-card-head">
              <div>
                <p className="po-card-number">{po.poNumber}</p>
                <p className="po-card-company">{po.company}</p>
              </div>
              <RowMenu po={po} onAction={onAction} readOnly={readOnly} />
            </div>
            <p className="po-card-amount mono">{formatINR(po.amount)}</p>
            <p className="po-card-meta mono">
              {progressOf(po).billed} / {progressOf(po).total} compounds billed
            </p>
            <POProgress po={po} compact />
            <div className="po-card-foot">
              <StatusBadge status={statusOf(po)} />
              <span className="po-card-date">{formatDate(po.dateAdded)}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onAction("View", po)}
              >
                <Eye size={14} /> View
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="table-scroll po-table-scroll">
      <table className="data-table po-table">
        <thead>
          <tr>
            {COLUMNS.map((column) =>
              column.sortable ? (
                <SortHeader key={column.key} column={column} sort={sort} onSort={onSort} />
              ) : (
                <th
                  key={column.key}
                  className={column.align === "right" ? "num" : undefined}
                >
                  {column.label}
                </th>
              )
            )}
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((po) => (
            <tr key={po.id}>
              <td className="cell-primary po-number-cell">{po.poNumber}</td>
              <td>{po.company}</td>
              <td>{po.month}</td>
              <td className="mono">{formatDate(po.dateAdded)}</td>
              <td className="num mono">{po.totalCompounds}</td>
              <td className="num mono">{po.billedCompounds}</td>
              <td>
                <POProgress po={po} />
              </td>
              <td className="num mono">{formatINR(po.amount)}</td>
              <td className="mono">{po.billNo || "—"}</td>
              <td>
                <StatusBadge status={statusOf(po)} />
              </td>
              <td className="po-remarks" title={po.remarks}>
                {po.remarks || "—"}
              </td>
              <td>
                <RowMenu po={po} onAction={onAction} readOnly={readOnly} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
