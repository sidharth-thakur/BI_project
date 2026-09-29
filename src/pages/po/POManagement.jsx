import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import Button from "../../components/common/Button";
import ToastStack from "../../components/common/Toast";
import POHeader from "../../components/po/POHeader";
import POKpiCards from "../../components/po/POKpiCards";
import POTabs from "../../components/po/POTabs";
import MonthlyPOSummary from "../../components/po/MonthlyPOSummary";
import PODetails from "../../components/po/PODetails";
import POFormModal from "../../components/po/POFormModal";
import PODetailModal from "../../components/po/PODetailModal";
import PODeleteModal from "../../components/po/PODeleteModal";
import {
  MONTHS,
  buildMonthlyMatrix,
  computeKPIs,
  createPO,
  deletePO,
  downloadCSV,
  formatLakhValue,
  listPOs,
  matrixToCSV,
  posToCSV,
  progressOf,
  statusOf,
  updatePO,
} from "../../services/poService";
import { useApp } from "../../context/AppContext";

const DEFAULT_FILTERS = {
  search: "",
  company: "All Companies",
  month: "All Months",
  status: "All Statuses",
};

const STATUS_OPTIONS = ["All Statuses", "Pending", "Partial", "Completed"];

function sortValue(po, key) {
  switch (key) {
    case "progress":
      return progressOf(po).percent;
    case "amount":
    case "totalCompounds":
    case "billedCompounds":
      return Number(po[key]) || 0;
    case "dateAdded":
      return po.dateAdded ?? "";
    default:
      return String(po[key] ?? "").toLowerCase();
  }
}

export default function POManagement() {
  /* ---------------- rights ---------------- */
  const { can } = useApp();
  const readOnly = !can("po");

  /* ---------------- data ---------------- */
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* ---------------- view state ---------------- */
  const [tab, setTab] = useState("summary");
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [summaryCompany, setSummaryCompany] = useState("All Companies");

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const deferredSearch = useDebouncedValue(search, 200);
  const [sort, setSort] = useState({ key: "dateAdded", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ---------------- modals ---------------- */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  /* ---------------- toasts ---------------- */
  const [toasts, setToasts] = useState([]);
  const toastSequence = useRef(0);

  const pushToast = useCallback((toast) => {
    toastSequence.current += 1;
    const id = `toast-${Date.now()}-${toastSequence.current}`;
    setToasts((list) => [...list, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((entry) => entry.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((entry) => entry.id !== id));
  }, []);

  /* ---------------- loading ---------------- */
  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError("");
      const result = await listPOs();
      if (cancelled) return;
      if (result.ok) {
        setPos(result.items);
      } else {
        setLoadError(result.error);
        pushToast({
          tone: "error",
          title: "Unable to load POs",
          message: result.error,
        });
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, pushToast]);

  /* ---------------- derived options ---------------- */
  const years = useMemo(() => {
    const set = new Set(pos.map((po) => (po.dateAdded ?? "").slice(0, 4)).filter(Boolean));
    set.add(currentYear);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [pos, currentYear]);

  const companies = useMemo(() => {
    const set = new Set(pos.map((po) => po.company).filter(Boolean));
    return ["All Companies", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [pos]);

  const kpis = useMemo(() => {
    const data = computeKPIs(pos, year);
    return { ...data, valueLabel: formatLakhValue(data.totalValue), year };
  }, [pos, year]);

  const matrix = useMemo(
    () => buildMonthlyMatrix(pos, { year, company: summaryCompany }),
    [pos, year, summaryCompany]
  );

  const activeFilters = useMemo(
    () => ({ ...filters, search: deferredSearch.trim() }),
    [filters, deferredSearch]
  );

  const filtered = useMemo(() => {
    const query = activeFilters.search.toLowerCase();
    return pos.filter((po) => {
      if ((po.dateAdded ?? "").slice(0, 4) !== String(year)) return false;
      if (activeFilters.company !== "All Companies" && po.company !== activeFilters.company)
        return false;
      if (activeFilters.month !== "All Months" && po.month !== activeFilters.month)
        return false;
      if (activeFilters.status !== "All Statuses" && statusOf(po) !== activeFilters.status)
        return false;
      if (
        query &&
        !po.poNumber.toLowerCase().includes(query) &&
        !po.company.toLowerCase().includes(query) &&
        !(po.billNo ?? "").toLowerCase().includes(query) &&
        !(po.remarks ?? "").toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [pos, year, activeFilters]);

  const sorted = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  /* Clamp in render (filters can shrink the result set at any time). */
  const currentPage = Math.min(page, pageCount);
  const rows = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ---------------- actions ---------------- */
  function patchFilter(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setPage(1);
  }

  function handleSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "amount" || key === "dateAdded" || key === "progress" ? "desc" : "asc" }
    );
  }

  /* Matrix drill-down: company + month + year → PO Details tab. */
  function drillInto(company, monthIndex) {
    setFilters({ ...DEFAULT_FILTERS, company, month: MONTHS[monthIndex] });
    setSearch("");
    setPage(1);
    setTab("details");
    pushToast({
      tone: "info",
      title: `Showing ${company} · ${MONTHS[monthIndex]} ${year}`,
      message: "PO Details is filtered to this cell.",
    });
  }

  function openAdd() {
    if (readOnly) return;
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(po) {
    if (readOnly) return;
    setViewing(null);
    setEditing(po);
    setFormOpen(true);
  }

  async function handleFormSubmit(values) {
    if (editing) {
      const result = await updatePO(editing.id, values);
      if (result.ok) {
        setPos((list) => list.map((po) => (po.id === result.record.id ? result.record : po)));
        setFormOpen(false);
        setEditing(null);
        pushToast({
          tone: "success",
          title: "Purchase order updated successfully",
          message: `${result.record.poNumber} was saved.`,
        });
      }
      return result;
    }

    const result = await createPO(values);
    if (result.ok) {
      setPos((list) => [result.record, ...list]);
      setFormOpen(false);
      pushToast({
        tone: "success",
        title: "Purchase order added successfully",
        message: `${result.record.poNumber} was created for ${result.record.company}.`,
      });
    }
    return result;
  }

  function handleRowAction(action, po) {
    if (action === "View") setViewing(po);
    else if (action === "Edit") openEdit(po);
    else if (action === "Delete" && !readOnly) setDeleting(po);
  }

  async function confirmDelete() {
    if (!deleting || readOnly) return;
    setDeleteBusy(true);
    const result = await deletePO(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      pushToast({ tone: "error", title: "Unable to delete purchase order", message: result.error });
      return;
    }
    pushToast({
      tone: "success",
      title: "Purchase order deleted successfully",
      message: `${deleting.poNumber} was removed.`,
    });
    if (viewing?.id === deleting.id) setViewing(null);
    setDeleting(null);
    setPos((list) => list.filter((po) => po.id !== deleting.id));
  }

  function handleExport(option) {
    try {
      if (option === "Export CSV") {
        downloadCSV(`po-summary-${year}.csv`, matrixToCSV(matrix));
        pushToast({ tone: "success", title: "PO data exported successfully", message: `po-summary-${year}.csv downloaded.` });
      } else if (option === "Print Summary") {
        window.print();
      }
    } catch {
      pushToast({
        tone: "error",
        title: "Unable to export",
        message: "Please try again.",
      });
    }
  }

  function handleDetailsExport(option) {
    if (option !== "Export CSV") return;
    try {
      downloadCSV(`po-details-${year}.csv`, posToCSV(sorted));
      pushToast({
        tone: "success",
        title: "PO data exported successfully",
        message: `${sorted.length} record${sorted.length === 1 ? "" : "s"} exported.`,
      });
    } catch {
      pushToast({ tone: "error", title: "Unable to export", message: "Please try again." });
    }
  }

  /* ---------------- render ---------------- */
  return (
    <div className="po-page">
      <POHeader
        title="Purchase Order Management"
        subtitle="Track purchase orders, billing progress and monthly PO performance"
      >
        {readOnly ? (
          <span className="badge badge-neutral" title="Your account has read-only access to purchase orders">
            Read-only access
          </span>
        ) : (
          <Button variant="accent" onClick={openAdd}>
            <Plus size={16} /> Add PO
          </Button>
        )}
      </POHeader>

      <POKpiCards kpis={kpis} loading={loading} />

      <POTabs active={tab} onChange={setTab} />

      {loadError && (
        <div className="inline-banner error" role="alert">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {tab === "summary" ? (
        <MonthlyPOSummary
          year={year}
          years={years}
          onYearChange={(value) => {
            setYear(value);
            setPage(1);
          }}
          company={summaryCompany}
          companies={companies}
          onCompanyChange={setSummaryCompany}
          matrix={matrix}
          loading={loading}
          onCellClick={drillInto}
          onExport={handleExport}
        />
      ) : (
        <PODetails
          rows={rows}
          total={sorted.length}
          filters={{ ...filters, search }}
          options={{
            companies,
            months: ["All Months", ...MONTHS],
            statuses: STATUS_OPTIONS,
          }}
          sort={sort}
          onSort={handleSort}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onPatch={patchFilter}
          onReset={resetFilters}
          onAdd={openAdd}
          onAction={handleRowAction}
          onExport={handleDetailsExport}
          readOnly={readOnly}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          loading={loading}
        />
      )}

      {pos.length === 0 && !loading && !loadError && tab === "summary" && (
        <p className="po-hint">
          <ReceiptText size={14} aria-hidden="true" />
          Create your first purchase order with <strong>+ Add PO</strong> to see
          monthly performance here.
        </p>
      )}

      <POFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        record={editing}
        onSubmit={handleFormSubmit}
      />

      <PODetailModal
        po={viewing}
        readOnly={readOnly}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDelete={(po) => {
          setViewing(null);
          if (readOnly) return;
          setDeleting(po);
        }}
      />

      <PODeleteModal
        po={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        deleting={deleteBusy}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/** Debounce a fast-changing value (search) to avoid re-filtering per keystroke. */
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
