import { useState } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import RightsToggle from "./RightsToggle";
import { MODULES, USER_ROLES } from "../../services/userService";

function emptyForm() {
  return {
    name: "",
    email: "",
    role: "Sales Executive",
    rights: { po: "read", quotations: "read" },
  };
}

/**
 * Shared Add / Edit user form (one modal, never two forms).
 * Fields: name, email, role + per-module Edit/Read-only rights.
 */
export default function UserFormModal({
  open,
  record = null,
  onSubmit,
  onClose,
  saving = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  /* Reset when the dialog target changes (derived state, per codebase style). */
  const [resetKey, setResetKey] = useState(null);
  const key = open ? (record?.id ?? "new") : null;
  if (key !== resetKey) {
    setResetKey(key);
    setForm(
      record
        ? {
            name: record.name ?? "",
            email: record.email ?? "",
            role: record.role ?? "Sales Executive",
            rights: { po: "read", quotations: "read", ...record.rights },
          }
        : emptyForm()
    );
    setFieldErrors({});
    setFormError("");
  }

  function patch(patchValue) {
    setForm((current) => ({ ...current, ...patchValue }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(patchValue).forEach((k) => delete next[k]);
      return next;
    });
  }

  function setRight(moduleKey, level) {
    setForm((current) => ({
      ...current,
      rights: { ...current.rights, [moduleKey]: level },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const result = await onSubmit(form);
    if (!result.ok) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result.error) setFormError(result.error);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? "Edit User" : "Add User"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : record ? "Save Changes" : "Create User"}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="user-name">Full Name</label>
          <input
            id="user-name"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            aria-invalid={fieldErrors.name ? "true" : undefined}
            placeholder="e.g. Priya Sharma"
          />
          {fieldErrors.name && (
            <span className="field-error">{fieldErrors.name}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
            aria-invalid={fieldErrors.email ? "true" : undefined}
            placeholder="name@vbiochem.example"
          />
          {fieldErrors.email && (
            <span className="field-error">{fieldErrors.email}</span>
          )}
        </div>

        <div className="field full">
          <label htmlFor="user-role">Role</label>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => patch({ role: event.target.value })}
            aria-invalid={fieldErrors.role ? "true" : undefined}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {fieldErrors.role && (
            <span className="field-error">{fieldErrors.role}</span>
          )}
        </div>

        <fieldset className="full rights-fieldset">
          <legend>Access rights</legend>
          <p className="form-note">
            Read-only users can open POs and quotations but cannot create,
            edit or delete them.
          </p>
          <div className="rights-rows">
            {MODULES.map((module) => (
              <div key={module.key} className="rights-row">
                <span className="rights-module">{module.label}</span>
                <RightsToggle
                  moduleLabel={module.label}
                  value={form.rights[module.key]}
                  onChange={(level) => setRight(module.key, level)}
                  disabled={saving}
                  idPrefix="user-form"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p className="field-error full" role="alert">
            {formError}
          </p>
        )}

        {/* Enter submits the modal from any field. */}
        <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1}>
          Save
        </button>
      </form>
    </Modal>
  );
}
