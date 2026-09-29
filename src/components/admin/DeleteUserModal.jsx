import Modal from "../common/Modal";
import Button from "../common/Button";

/**
 * Delete confirmation — never uses browser confirm(). Service guards
 * (own account / last administrator) surface as an inline error here.
 */
export default function DeleteUserModal({ user, busy = false, error = "", onConfirm, onClose }) {
  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Delete user?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Delete User"}
          </Button>
        </>
      }
    >
      {user && (
        <>
          <p className="text-muted">
            <strong>{user.name}</strong> ({user.email}) will be permanently
            removed. This action cannot be undone.
          </p>
          <p className="form-note">
            Existing quotations, purchase orders and bills are never deleted
            with a user — only access is removed.
          </p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
