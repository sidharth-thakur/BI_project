import { useMemo, useState } from "react";
import {
  Plus,
  PhoneCall,
  Clock,
  CalendarDays,
  CheckCircle2,
  Trash2,
  Pencil,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Dropdown from "../../components/common/Dropdown";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { followUps as initialFollowUps } from "../../data/followupsData";
import { clients } from "../../data/clientsData";

const TABS = [
  { key: "today", label: "Today's" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

const STATUS_FILTERS = ["All Statuses", "Scheduled", "Completed", "Overdue", "Cancelled"];

const EMPTY_FORM = {
  client: clients[0].name,
  contact: clients[0].contact,
  date: "",
  time: "",
  purpose: "",
  assignedTo: "Vikas",
  notes: "",
};

function initialsOf(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function CallStatus() {
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [tab, setTab] = useState("today");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const counts = useMemo(() => {
    const completed = followUps.filter((f) => f.status === "Completed");
    const today = followUps.filter((f) => f.bucket === "today" && f.status !== "Completed");
    const upcoming = followUps.filter((f) => f.bucket === "upcoming" && f.status !== "Completed");
    const overdue = followUps.filter((f) => f.status === "Overdue");
    return { today, upcoming, overdue, completed };
  }, [followUps]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return counts[tab].filter((item) => {
      const matchesStatus =
        statusFilter === "All Statuses" || item.status === statusFilter;
      const matchesQuery =
        !query ||
        item.client.toLowerCase().includes(query) ||
        item.contact.toLowerCase().includes(query) ||
        item.purpose.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [counts, tab, statusFilter, search]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setForm({
      client: item.client,
      contact: item.contact,
      date: item.date,
      time: item.time,
      purpose: item.purpose,
      assignedTo: item.assignedTo,
      notes: item.notes,
    });
    setFormOpen(true);
  }

  function saveFollowUp() {
    if (!form.purpose.trim()) return;

    const base = {
      client: form.client,
      contact: form.contact,
      date: form.date || "TBD",
      time: form.time || "TBD",
      purpose: form.purpose.trim(),
      assignedTo: form.assignedTo,
      notes: form.notes.trim(),
    };

    if (editing) {
      setFollowUps((list) =>
        list.map((item) => (item.id === editing ? { ...item, ...base } : item))
      );
    } else {
      setFollowUps((list) => [
        {
          id: `F-${Date.now()}`,
          initials: initialsOf(form.client),
          status: "Scheduled",
          bucket: "upcoming",
          ...base,
        },
        ...list,
      ]);
    }
    setFormOpen(false);
  }

  function markCompleted(item) {
    setFollowUps((list) =>
      list.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "Completed", bucket: "completed" }
          : entry
      )
    );
  }

  function reschedule(item) {
    setFollowUps((list) =>
      list.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "Scheduled", bucket: "upcoming" }
          : entry
      )
    );
  }

  return (
    <>
      <PageHeader
        title="Call Status / Follow-ups"
        subtitle={`${counts.today.length} scheduled today · ${counts.overdue.length} overdue`}
      >
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Follow-up
        </Button>
      </PageHeader>

      <div className="tabs" role="tablist" aria-label="Follow-up buckets">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`tab${tab === item.key ? " active" : ""}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
            <span className="tab-count">{counts[item.key].length}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by client, contact or purpose..."
          ariaLabel="Search follow-ups"
        />
        <Dropdown
          label={statusFilter}
          value={statusFilter}
          options={STATUS_FILTERS}
          onSelect={setStatusFilter}
          align="left"
          ariaLabel="Filter by status"
        />
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={PhoneCall}
            title="No follow-ups here"
            description="Nothing matches this view. Add a follow-up or change the filters."
            action={<Button onClick={openAdd}>Add Follow-up</Button>}
          />
        </Card>
      ) : (
        <div className="followup-grid">
          {visible.map((item) => (
            <Card key={item.id} hoverable className="followup-card">
              <div className="followup-card-head">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="avatar" aria-hidden="true">
                    {item.initials}
                  </span>
                  <div>
                    <div className="followup-card-client">{item.client}</div>
                    <div className="followup-card-contact">{item.contact}</div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="followup-meta">
                <span className="meta-chip">
                  <CalendarDays size={13} aria-hidden="true" /> {item.date}
                </span>
                <span className="meta-chip">
                  <Clock size={13} aria-hidden="true" /> {item.time}
                </span>
                <span className="meta-chip">{item.assignedTo}</span>
              </div>

              <div className="followup-purpose" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
                {item.purpose}
              </div>

              <p className="followup-notes">{item.notes}</p>

              <div className="followup-card-actions">
                {item.status !== "Completed" && (
                  <Button
                    size="sm"
                    variant="success-soft"
                    onClick={() => markCompleted(item)}
                  >
                    <CheckCircle2 size={14} /> Complete
                  </Button>
                )}
                {item.status === "Overdue" && (
                  <Button size="sm" variant="secondary" onClick={() => reschedule(item)}>
                    Reschedule
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete follow-up for ${item.client}`}
                  onClick={() =>
                    setFollowUps((list) => list.filter((entry) => entry.id !== item.id))
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Follow-up" : "Add Follow-up"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFollowUp} disabled={!form.purpose.trim()}>
              {editing ? "Save Changes" : "Add Follow-up"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="fu-client">Client</label>
            <select
              id="fu-client"
              value={form.client}
              onChange={(event) => {
                const client = clients.find((c) => c.name === event.target.value);
                setForm({
                  ...form,
                  client: client.name,
                  contact: client.contact,
                });
              }}
            >
              {clients.map((client) => (
                <option key={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="fu-date">Date</label>
            <input
              id="fu-date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              placeholder="e.g. 15 Sep 2025"
            />
          </div>
          <div className="field">
            <label htmlFor="fu-time">Time</label>
            <input
              id="fu-time"
              value={form.time}
              onChange={(event) => setForm({ ...form, time: event.target.value })}
              placeholder="e.g. 11:00 AM"
            />
          </div>
          <div className="field full">
            <label htmlFor="fu-purpose">Purpose</label>
            <input
              id="fu-purpose"
              value={form.purpose}
              onChange={(event) => setForm({ ...form, purpose: event.target.value })}
              placeholder="e.g. Quotation discussion"
            />
          </div>
          <div className="field full">
            <label htmlFor="fu-notes">Notes</label>
            <textarea
              id="fu-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="What should be covered on this call?"
            />
          </div>
        </div>
        <p className="form-note">Stored locally in this session — no backend connected.</p>
      </Modal>
    </>
  );
}
