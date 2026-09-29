import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, FileText, Save } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ToastStack from "../../components/common/Toast";
import ClientSelector from "../../components/quotations/ClientSelector";
import QuotationDetails from "../../components/quotations/QuotationDetails";
import ProductTable from "../../components/quotations/ProductTable";
import QuotationSummary from "../../components/quotations/QuotationSummary";
import PaymentTerms from "../../components/quotations/PaymentTerms";
import QuotationNotes from "../../components/quotations/QuotationNotes";
import SaveQuotationBar from "../../components/quotations/SaveQuotationBar";
import QuotationPreview from "../../components/quotations/QuotationPreview";
import {
  DEFAULT_USD_RATE,
  getQuotation,
  nextQuotationNumber,
  saveQuotation,
  toISODate,
  validateQuotation,
} from "../../services/quotationService";
import { useApp } from "../../context/AppContext";

let rowSequence = 0;
const newRow = () => {
  rowSequence += 1;
  return {
    id: `row-${Date.now()}-${rowSequence}`,
    desc: "",
    hsn: "",
    qty: 1,
    unit: "Kg",
    timeline: "",
    price: "",
    productId: null,
  };
};

function emptyForm() {
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  return {
    id: null,
    number: "",
    date: toISODate(today),
    validUntil: toISODate(validUntil),
    currency: "INR",
    rate: DEFAULT_USD_RATE,
    freight: "",
    client: null,
    items: [],
    paymentTerms: "30 Days",
    customTerms: "",
    deliveryTimeline: "",
    termsNotes: "",
    notes: "",
    createdAt: null,
  };
}

export default function CreateQuotation() {
  const navigate = useNavigate();
  const { number: editNumber } = useParams();
  const { can } = useApp();
  const readOnly = !can("quotations");

  const [form, setForm] = useState(emptyForm);
  const [numberLoading, setNumberLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const toastSequence = useRef(0);

  const editing = Boolean(editNumber);

  /* Read-only accounts are sent back to the list (no form to fill). */
  useEffect(() => {
    if (readOnly) navigate("/quotations", { replace: true });
  }, [readOnly, navigate]);

  const pushToast = useCallback((toast) => {
    const id = `toast-${Date.now()}-${(toastSequence.current += 1)}`;
    setToasts((list) => [...list, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((entry) => entry.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((entry) => entry.id !== id));
  }, []);

  const patchForm = useCallback((patch) => {
    setForm((current) => ({ ...current, ...patch }));
    /* Clear field errors as soon as the field changes. */
    setErrors((current) => {
      const next = { ...current };
      if ("client" in patch) delete next.client;
      if ("currency" in patch) delete next.currency;
      if ("number" in patch) delete next.number;
      return next;
    });
  }, []);

  /* Load an existing quotation for editing, or generate the next number. */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setNumberLoading(true);
      if (editNumber) {
        const result = await getQuotation(editNumber);
        if (cancelled) return;
        if (result.ok && result.record) {
          const record = result.record;
          setForm({
            ...emptyForm(),
            ...record,
            freight: record.freight || "",
            rate: record.rate || DEFAULT_USD_RATE,
            items: (record.items ?? []).map((item) => ({
              ...item,
              id: `row-${Date.now()}-${(rowSequence += 1)}`,
            })),
          });
        } else {
          pushToast({
            tone: "error",
            title: "Quotation not found",
            message: `Could not load ${editNumber}. It may have been deleted.`,
          });
          navigate("/quotations", { replace: true });
        }
      } else {
        const result = await nextQuotationNumber();
        if (cancelled) return;
        if (result.ok) {
          setForm((current) => ({ ...current, number: result.number }));
        } else {
          pushToast({
            tone: "error",
            title: "Could not generate quotation number",
            message: result.error,
          });
        }
      }
      if (!cancelled) setNumberLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [editNumber, navigate, pushToast]);

  /* ---------------- Line items ---------------- */

  const addItem = useCallback(() => {
    setForm((current) => ({ ...current, items: [...current.items, newRow()] }));
    setErrors((current) => {
      if (!current.itemsList) return current;
      const next = { ...current };
      delete next.itemsList;
      return next;
    });
  }, []);

  const updateItem = useCallback((id, patch) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
    setErrors((current) => {
      if (!current.items?.[id]) return current;
      const rowErrors = { ...current.items[id] };
      if ("desc" in patch) delete rowErrors.desc;
      if ("qty" in patch) delete rowErrors.qty;
      if ("price" in patch) delete rowErrors.price;
      const items = { ...current.items };
      if (Object.keys(rowErrors).length) {
        items[id] = rowErrors;
      } else {
        delete items[id];
      }
      return { ...current, items };
    });
  }, []);

  const removeItem = useCallback((id) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
    setErrors((current) => {
      if (!current.items) return current;
      const next = { ...current.items };
      delete next[id];
      return { ...current, items: next };
    });
  }, []);

  /* ---------------- Preview / save ---------------- */

  const previewModel = useMemo(
    () => ({
      ...form,
      paymentTerms:
        form.paymentTerms === "Custom"
          ? form.customTerms || "Custom"
          : form.paymentTerms,
      freight: Number(form.freight) || 0,
      rate: Number(form.rate) || DEFAULT_USD_RATE,
    }),
    [form]
  );

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const target = document.querySelector('[aria-invalid="true"]');
      if (target && typeof target.focus === "function") target.focus();
    });
  }

  async function persist(status) {
    if (readOnly) {
      pushToast({
        tone: "error",
        title: "Read-only access",
        message: "Your account can view quotations but not change them.",
      });
      return null;
    }
    setSaving(true);
    const result = await saveQuotation(
      { ...form, freight: Number(form.freight) || 0 },
      { status, editing: Boolean(form.id) }
    );
    setSaving(false);

    if (!result.ok) {
      pushToast({ tone: "error", title: "Save failed", message: result.error });
      return null;
    }

    setForm((current) => ({ ...current, id: result.record.id }));
    return result.record;
  }

  async function handleSave() {
    const validation = validateQuotation(form);
    setErrors(validation);

    if (!validation.valid) {
      pushToast({
        tone: "error",
        title: "Quotation is incomplete",
        message: "Please fix the highlighted fields before saving.",
      });
      focusFirstError();
      return;
    }

    const record = await persist("Saved");
    if (record) {
      pushToast({
        tone: "success",
        title: "Quotation saved successfully",
        message: `${record.number} saved against ${record.client.company}.`,
      });
      setSavedRecord(record);
    }
  }

  async function handleSaveDraft() {
    let number = form.number;
    if (!number) {
      const generated = await nextQuotationNumber();
      if (!generated.ok) {
        pushToast({
          tone: "error",
          title: "Could not save draft",
          message: generated.error,
        });
        return;
      }
      number = generated.number;
      setForm((current) => ({ ...current, number }));
    }

    const record = await persist("Draft");
    if (record) {
      pushToast({
        tone: "success",
        title: "Draft saved",
        message: `${record.number} saved as a draft — continue editing anytime.`,
      });
    }
  }

  function resetForNewQuotation() {
    setSavedRecord(null);
    setErrors({});
    setForm(emptyForm());
    setNumberLoading(true);
    nextQuotationNumber().then((result) => {
      if (result.ok) setForm((current) => ({ ...current, number: result.number }));
      setNumberLoading(false);
    });
  }

  return (
    <div className="quote-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <Link to="/quotations">Quotations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{editing ? "Edit" : "Create"}</span>
      </nav>

      <PageHeader
        title={editing ? "Edit Quotation" : "Create Quotation"}
        subtitle="Generate a professional quotation for your clients"
      >
        {readOnly ? (
          <span className="badge badge-neutral" title="Your account has read-only access to quotations">
            Read-only access
          </span>
        ) : (
          <>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
              <FileText size={16} /> Save Draft
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye size={16} /> Preview
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              <Save size={16} /> Save Quotation
            </Button>
          </>
        )}
      </PageHeader>

      {readOnly && (
        <div className="inline-banner" role="note">
          <span>
            Your account has read-only access to quotations. You can browse
            this form but cannot save changes.
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate("/quotations")}>
            Back to Quotations
          </Button>
        </div>
      )}

      <div className="quote-form">
        <ClientSelector
          client={form.client}
          error={errors.client}
          onSelect={(client) => patchForm({ client })}
        />

        <QuotationDetails
          form={form}
          onChange={patchForm}
          errors={errors}
          numberLoading={numberLoading}
        />

        <ProductTable
          items={form.items}
          currency={form.currency}
          errors={errors}
          onChangeItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <div className="quote-split">
          <PaymentTerms form={form} onChange={patchForm} />
          <QuotationSummary
            form={form}
            errors={errors}
            onFreightChange={(value) => patchForm({ freight: value })}
          />
        </div>

        <QuotationNotes
          value={form.notes}
          onChange={(notes) => patchForm({ notes })}
        />
      </div>

      {!readOnly && (
        <SaveQuotationBar
          saving={saving}
          onCancel={() => navigate("/quotations")}
          onSaveDraft={handleSaveDraft}
          onPreview={() => setPreviewOpen(true)}
          onSave={handleSave}
          hint="Drafts stay editable from the Quotations page. Nothing leaves this device until a backend is connected."
        />
      )}

      {/* Quotation preview (printable) */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Quotation Preview"
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              variant="accent"
              onClick={() => window.print()}
              disabled={!previewModel.client && !previewModel.items.length}
            >
              Print / Save PDF
            </Button>
          </>
        }
      >
        <QuotationPreview quotation={previewModel} />
      </Modal>

      {/* Post-save success */}
      <Modal
        open={Boolean(savedRecord)}
        onClose={() => setSavedRecord(null)}
        title="Quotation saved successfully"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setSavedRecord(null);
                navigate("/quotations");
              }}
            >
              Back to Quotations
            </Button>
            <Button variant="secondary" onClick={resetForNewQuotation}>
              Create Another
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                const target = savedRecord?.number;
                setSavedRecord(null);
                navigate(`/quotations/view/${target}`);
              }}
            >
              View Quotation
            </Button>
          </>
        }
      >
        <p className="text-muted">
          <strong>{savedRecord?.number}</strong> was saved against{" "}
          <strong>{savedRecord?.client?.company}</strong>. Open it to print, share
          or keep editing.
        </p>
      </Modal>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
