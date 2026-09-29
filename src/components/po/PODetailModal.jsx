import Modal from "../common/Modal";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import POProgress from "./POProgress";
import {
  formatDateLong,
  formatINR,
  progressOf,
  statusOf,
} from "../../services/poService";

/**
 * Read-only purchase order detail modal with Edit / Delete / Close
 * (mutation buttons hidden for read-only accounts).
 */
export default function PODetailModal({ po, onClose, onEdit, onDelete, readOnly = false }) {
  return (
    <Modal
      open={Boolean(po)}
      onClose={onClose}
      title="Purchase Order"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!readOnly && (
            <>
              <Button variant="secondary" onClick={() => onDelete(po)}>
                Delete
              </Button>
              <Button variant="accent" onClick={() => onEdit(po)}>
                Edit
              </Button>
            </>
          )}
        </>
      }
    >
      {po && (
        <>
          <div className="po-detail-head">
            <p className="po-detail-number">{po.poNumber}</p>
            <p className="po-detail-company">{po.company}</p>
            <StatusBadge status={statusOf(po)} />
          </div>

          <dl className="detail-list po-detail-grid">
            <div>
              <dt>PO Date</dt>
              <dd>{formatDateLong(po.dateAdded)}</dd>
            </div>
            <div>
              <dt>Month</dt>
              <dd>{po.month}</dd>
            </div>
            <div>
              <dt>Total Compounds</dt>
              <dd className="mono">{po.totalCompounds}</dd>
            </div>
            <div>
              <dt>Billed Compounds</dt>
              <dd className="mono">{po.billedCompounds}</dd>
            </div>
            <div>
              <dt>Billing Progress</dt>
              <dd>
                <POProgress po={po} />
              </dd>
            </div>
            <div>
              <dt>PO Amount</dt>
              <dd className="mono">{formatINR(po.amount)}</dd>
            </div>
            <div>
              <dt>Bill Number</dt>
              <dd className="mono">
                {po.billNo ? (
                  po.billLink ? (
                    <a
                      href={po.billLink}
                      target="_blank"
                      rel="noreferrer"
                      className="po-bill-link"
                    >
                      {po.billNo}
                    </a>
                  ) : (
                    po.billNo
                  )
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd className="mono">{progressOf(po).percent}%</dd>
            </div>
            <div className="full">
              <dt>Remarks</dt>
              <dd>{po.remarks || "—"}</dd>
            </div>
          </dl>
        </>
      )}
    </Modal>
  );
}
