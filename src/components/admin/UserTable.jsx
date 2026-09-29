import { Pencil, Repeat2, Trash2, Users } from "lucide-react";
import Badge from "../common/Badge";
import DataTable from "../tables/DataTable";
import RightsToggle from "./RightsToggle";
import { MODULES } from "../../services/userService";

const ROLE_TONES = {
  Administrator: "primary",
  "Sales Executive": "info",
  Viewer: "neutral",
};

function initialsOf(name) {
  return String(name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Users data table: identity + role badges, inline Edit / Read-only rights
 * toggles per module, and row actions (edit / sign in as / delete).
 * Non-administrators get a read-only table.
 */
export default function UserTable({
  rows,
  loading = false,
  isAdmin = true,
  sessionUserId,
  onRightsChange,
  onEdit,
  onSwitch,
  onDelete,
  emptyDescription,
}) {
  const columns = [
    {
      key: "name",
      label: "User",
      primary: true,
      render: (row) => (
        <span className="user-cell">
          <span className="avatar sm" aria-hidden="true">
            {initialsOf(row.name)}
          </span>
          <span className="cell-stack">
            {row.name}
            <small>{row.email}</small>
          </span>
          {row.id === sessionUserId && <Badge tone="success">Signed in</Badge>}
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <Badge tone={ROLE_TONES[row.role] ?? "neutral"}>{row.role}</Badge>
      ),
    },
    ...MODULES.map((module) => ({
      key: `rights-${module.key}`,
      label: module.label,
      render: (row) => (
        <RightsToggle
          moduleLabel={module.label}
          value={row.rights?.[module.key] ?? "read"}
          onChange={
            isAdmin ? (level) => onRightsChange?.(row, module.key, level) : undefined
          }
          disabled={!isAdmin}
          idPrefix={`row-${row.id}`}
        />
      ),
    })),
    {
      key: "createdAt",
      label: "Created",
      render: (row) => <span className="mono">{row.createdAt ?? "—"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="table-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${row.name}`}
            disabled={!isAdmin}
            onClick={() => onEdit?.(row)}
          >
            <Pencil size={16} />
          </button>
          {row.id !== sessionUserId && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Sign in as ${row.name}`}
              title={`Sign in as ${row.name}`}
              onClick={() => onSwitch?.(row)}
            >
              <Repeat2 size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            aria-label={`Delete ${row.name}`}
            disabled={!isAdmin || row.id === sessionUserId}
            title={
              row.id === sessionUserId
                ? "You cannot delete your own account"
                : `Delete ${row.name}`
            }
            onClick={() => onDelete?.(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p className="empty-desc">Loading users...</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      emptyIcon={Users}
      emptyTitle="No users found"
      emptyDescription={emptyDescription}
    />
  );
}
