import Modal from "../common/Modal";
import Button from "../common/Button";

/**
 * Delete confirmation modal — never uses browser confirm().
 */
export default function PODeleteModal({ po, onClose, onConfirm, deleting = false }) {
  return (
    <Modal
      open={Boolean(po)}
      onClose={onClose}
      title="Delete Purchase Order?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete PO"}
          </Button>
        </>
      }
    >
      <p className="text-muted">
        Are you sure you want to delete <strong>{po?.poNumber}</strong>?
      </p>
      <p className="text-muted">This action cannot be undone.</p>
    </Modal>
  );
}
