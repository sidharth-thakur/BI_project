import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Dropdown from "../../components/common/Dropdown";
import ToastStack from "../../components/common/Toast";
import UserTable from "../../components/admin/UserTable";
import UserFormModal from "../../components/admin/UserFormModal";
import DeleteUserModal from "../../components/admin/DeleteUserModal";
import { useApp } from "../../context/AppContext";
import {
  MODULES,
  USER_ROLES,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../../services/userService";

const ROLE_FILTERS = ["All Roles", ...USER_ROLES];

export default function UserManagement() {
  const { user: sessionUser, switchSession } = useApp();
  const isAdmin = sessionUser.role === "Administrator";

  /* ---------------- data ---------------- */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* ---------------- view state ---------------- */
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  /* ---------------- modals ---------------- */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);

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
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError("");
      const result = await listUsers();
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

  /* ---------------- derived ---------------- */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "All Roles" && row.role !== roleFilter) return false;
      if (
        query &&
        !row.name.toLowerCase().includes(query) &&
        !row.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, search, roleFilter]);

  const counts = useMemo(() => {
    const admins = rows.filter((row) => row.role === "Administrator").length;
    const editors = rows.filter(
      (row) => row.rights?.po === "edit" || row.rights?.quotations === "edit"
    ).length;
    return { total: rows.length, admins, editors };
  }, [rows]);

  /* ---------------- actions ---------------- */
  async function handleFormSubmit(values) {
    setSaving(true);
    const result = editing
      ? await updateUser(editing.id, values)
      : await createUser(values);
    setSaving(false);

    if (!result.ok) return result;

    if (editing) {
      setRows((list) =>
        list.map((row) => (row.id === result.record.id ? result.record : row))
      );
      pushToast({
        tone: "success",
        title: "User updated",
        message: `${result.record.name}'s details and rights were saved.`,
      });
    } else {
      setRows((list) => [...list, result.record]);
      pushToast({
        tone: "success",
        title: "User created",
        message: `${result.record.name} can now sign in with ${result.record.email}.`,
      });
    }
    setFormOpen(false);
    setEditing(null);
    return result;
  }

  async function changeRight(row, moduleKey, level) {
    if (row.rights?.[moduleKey] === level) return;
    const next = { ...row.rights, [moduleKey]: level };
    const result = await updateUser(row.id, { rights: next });
    if (!result.ok) {
      pushToast({ tone: "error", title: "Unable to update rights", message: result.error });
      return;
    }
    setRows((list) =>
      list.map((entry) => (entry.id === row.id ? result.record : entry))
    );
    const module = MODULES.find((entry) => entry.key === moduleKey);
    pushToast({
      tone: "success",
      title: "Rights updated",
      message: `${row.name} can now ${level === "edit" ? "change" : "only view"} ${module?.label ?? moduleKey}.`,
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError("");
    const result = await deleteUser(deleting.id);
    setDeleteBusy(false);

    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    pushToast({
      tone: "success",
      title: "User deleted",
      message: `${result.record.name} no longer has access.`,
    });
    setDeleting(null);
    setRows((list) => list.filter((row) => row.id !== deleting.id));
  }

  async function handleSwitch(row) {
    const result = await switchSession(row.id);
    if (!result.ok) {
      pushToast({ tone: "error", title: "Unable to switch", message: result.error });
      return;
    }
    pushToast({
      tone: "info",
      title: `Signed in as ${row.name}`,
      message: "PO and quotation pages now use this user's rights.",
    });
  }

  /* ---------------- render ---------------- */
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Administration</span>
      </nav>

      <PageHeader
        title="User Management"
        subtitle="Create users, manage roles and grant edit or read-only access to POs and quotations"
      >
        <Button
          variant="accent"
          disabled={!isAdmin}
          title={isAdmin ? undefined : "Only administrators can add users"}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Add User
        </Button>
      </PageHeader>

      {!isAdmin && (
        <div className="inline-banner" role="note">
          <span>
            You are signed in as {sessionUser.fullName} ({sessionUser.role}).
            Only administrators can create users, change roles or update
            access rights.
          </span>
        </div>
      )}

      {loadError && (
        <div className="inline-banner error" role="alert">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or email..."
          ariaLabel="Search users"
        />
        <Dropdown
          label={roleFilter}
          value={roleFilter}
          options={ROLE_FILTERS}
          onSelect={setRoleFilter}
          align="left"
          ariaLabel="Filter by role"
        />
        <span className="toolbar-spacer" />
        <span className="admin-counts">
          {counts.total} users · {counts.admins} admin
          {counts.admins === 1 ? "" : "s"} · {counts.editors} with edit access
        </span>
      </div>

      <Card className="table-card">
        <UserTable
          rows={filtered}
          loading={loading}
          isAdmin={isAdmin}
          sessionUserId={sessionUser.id}
          onRightsChange={changeRight}
          onEdit={(row) => {
            setEditing(row);
            setFormOpen(true);
          }}
          onSwitch={handleSwitch}
          onDelete={(row) => {
            setDeleteError("");
            setDeleting(row);
          }}
          emptyDescription={
            search || roleFilter !== "All Roles"
              ? "Try changing the search or role filter."
              : "Create your first user to get started."
          }
        />
      </Card>

      <UserFormModal
        open={formOpen}
        record={editing}
        saving={saving}
        onSubmit={async (values) => {
          const result = await handleFormSubmit(values);
          return result;
        }}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <DeleteUserModal
        user={deleting}
        busy={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleting(null);
          setDeleteError("");
        }}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
