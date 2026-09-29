import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/common/Button";
import LoadingState from "../../components/common/LoadingState";
import StatusBadge from "../../components/common/StatusBadge";
import QuotationDocument from "../../components/quotations/QuotationPreview";
import { formatDate, getQuotation } from "../../services/quotationService";
import { useApp } from "../../context/AppContext";

/**
 * Full-page view of a saved quotation — print/PDF ready.
 */
export default function QuotationPreview() {
  const { number } = useParams();
  const navigate = useNavigate();
  const { can } = useApp();
  const readOnly = !can("quotations");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Async loader declared inside the effect. */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");
      const result = await getQuotation(number);
      if (cancelled) return;
      if (result.ok && result.record) {
        setRecord(result.record);
      } else {
        setRecord(null);
        setError(
          result.ok
            ? `Quotation ${number} was not found. It may have been deleted.`
            : result.error
        );
      }
      setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [number]);

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <Link to="/quotations">Quotations</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{number}</span>
      </nav>

      <PageHeader
        title={number ?? "Quotation"}
        subtitle={
          record ? (
            <span className="breadcrumb-sub">
              <StatusBadge status={record.status ?? "Saved"} /> ·{" "}
              {record.client?.company ?? "No client"} · Dated{" "}
              {formatDate(record.date)}
            </span>
          ) : (
            "Professional quotation document"
          )
        }
      >
        <Button variant="ghost" onClick={() => navigate("/quotations")}>
          <ArrowLeft size={16} /> Back
        </Button>
        {record && !readOnly && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/quotations/edit/${record.number}`)}
          >
            <Pencil size={16} /> Edit
          </Button>
        )}
        <Button
          variant="accent"
          onClick={() => window.print()}
          disabled={loading || !record}
        >
          <Printer size={16} /> Print / PDF
        </Button>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading quotation..." />
      ) : error ? (
        <div className="inline-banner error" role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => navigate("/quotations")}>
            Back to Quotations
          </Button>
        </div>
      ) : (
        <div className="quote-doc-page">
          <QuotationDocument quotation={record} />
        </div>
      )}
    </>
  );
}
