import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import ToastStack from "../../components/common/Toast";
import DataTable from "../../components/tables/DataTable";
import {
  deleteQuotation,
  formatAmount,
  formatDate,
  listQuotations,
} from "../../services/quotationService";
import { useApp } from "../../context/AppContext";

export default function QuotationsList() {
  const navigate = useNavigate();
  const { can } = useApp();
  const readOnly = !can("quotations");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const toastSequence = useRef(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const pushToast = useCallback((toast) => {
    toastSequence.current += 1;
    const id = `toast-${Date.now()}-${toastSequence.current}`;
    setToasts((list) => [...list, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((entry) => entry.id !== id));
    }, 4500);
  }, []);

  /* Async loader declared inside the effect; refetch via reload token. */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError("");
      const result = await listQuotations();
      if (cancelled) return;
      if (result.ok) {
        setRows(result.items);
      } else {
        setLoadError(result.error);
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function confirmDelete() {
    if (readOnly) {
      setDeleting(null);
      return;
    }
    const result = await deleteQuotation(deleting.number);
    setDeleting(null);
    if (!result.ok) {
      pushToast({ tone: "error", title: "Delete failed", message: result.error });
      return;
    }
    pushToast({
      tone: "success",
      title: "Quotation deleted",
      message: `${deleting.number} was removed.`,
    });
    reload();
  }

  const columns = [
    {
      key: "number",
      label: "Quotation",
      primary: true,
      render: (row) => (
        <span className="cell-stack">
          {row.number}
          <small>{row.client?.company ?? "No client"}</small>
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatDate(row.date),
    },
    {
      key: "validUntil",
      label: "Valid Until",
      render: (row) => formatDate(row.validUntil),
    },
    {
      key: "items",
      label: "Items",
      align: "right",
      render: (row) => <span className="mono">{row.items?.length ?? 0}</span>,
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      render: (row) => (
        <span className="mono">
          {formatAmount(row.totals?.grandTotal ?? 0, row.currency ?? "INR")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status ?? "Draft"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`View ${row.number}`}
            onClick={() => navigate(`/quotations/view/${row.number}`)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${row.number}`}
            disabled={readOnly}
            onClick={() => navigate(`/quotations/edit/${row.number}`)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${row.number}`}
            disabled={readOnly}
            onClick={() => setDeleting(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle={`${rows.length} quotation${rows.length === 1 ? "" : "s"} — drafts and saved`}
      >
        {readOnly ? (
          <span className="badge badge-neutral" title="Your account has read-only access to quotations">
            Read-only access
          </span>
        ) : (
          <Button onClick={() => navigate("/quotations/create")}>
            <Plus size={16} /> Create Quotation
          </Button>
        )}
      </PageHeader>

      {loadError && (
        <div className="inline-banner error">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      <Card className="table-card">
        {loading ? (
          <div className="loading-state" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p className="empty-desc">Loading quotations...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id ?? row.number}
            emptyIcon={FileText}
            emptyTitle="No quotations yet"
            emptyDescription="Create your first quotation to get started."
          />
        )}
      </Card>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete quotation?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-muted">
          <strong>{deleting?.number}</strong> will be permanently removed. This
          action cannot be undone.
        </p>
      </Modal>

      <ToastStack toasts={toasts} onDismiss={(id) =>
        setToasts((list) => list.filter((entry) => entry.id !== id))
      } />
    </>
  );
}
