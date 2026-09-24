import { useMemo, useState } from "react";
import { Plus, Users, Pencil, Trash2, Eye } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Dropdown from "../../components/common/Dropdown";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/tables/DataTable";
import Pagination from "../../components/tables/Pagination";
import { clients as initialClients } from "../../data/clientsData";

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  "All Statuses",
  "New",
  "Under Discussion",
  "Order Received",
  "No Response",
];

const CATEGORIES = [
  "All Categories",
  "Pharma",
  "Research Lab",
  "Biotech",
  "Healthcare",
  "Industrial",
];

const EMPTY_FORM = {
  name: "",
  contact: "",
  phone: "",
  email: "",
  category: "Pharma",
  city: "",
  notes: "",
};

export default function ClientsLeads() {
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const stats = useMemo(() => {
    const count = (value) => clients.filter((c) => c.status === value).length;
    return [
      { label: "Total Clients", value: clients.length },
      { label: "Active Leads", value: count("Under Discussion") },
      { label: "New Leads", value: count("New") },
      { label: "Needs Follow-up", value: count("No Response") },
    ];
  }, [clients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesStatus = status === "All Statuses" || client.status === status;
      const matchesCategory =
        category === "All Categories" || client.category === category;
      const matchesQuery =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.contact.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.city.toLowerCase().includes(query);
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [clients, search, status, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(client) {
    setEditing(client.id);
    setForm({
      name: client.name,
      contact: client.contact,
      phone: client.phone,
      email: client.email,
      category: client.category,
      city: client.city,
      notes: client.notes,
    });
    setFormOpen(true);
  }

  function saveClient() {
    if (!form.name.trim() || !form.contact.trim()) return;

    const base = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      category: form.category,
      city: form.city.trim(),
      notes: form.notes.trim(),
    };

    if (editing) {
      setClients((list) =>
        list.map((client) =>
          client.id === editing ? { ...client, ...base } : client
        )
      );
    } else {
      setClients((list) => [
        {
          id: `C-${Date.now()}`,
          lastContact: "Just now",
          status: "New",
          ...base,
        },
        ...list,
      ]);
    }
    setFormOpen(false);
  }

  const columns = [
    {
      key: "name",
      label: "Client",
      primary: true,
      render: (client) => (
        <span className="cell-stack">
          {client.name}
          <small>{client.city}</small>
        </span>
      ),
    },
    { key: "contact", label: "Contact Person" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "category", label: "Category" },
    { key: "lastContact", label: "Last Contact" },
    {
      key: "status",
      label: "Status",
      render: (client) => <StatusBadge status={client.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (client) => (
        <div className="table-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`View ${client.name}`}
            onClick={() => setDetails(client)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${client.name}`}
            onClick={() => openEdit(client)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${client.name}`}
            onClick={() => setDeleting(client)}
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
        title="Clients & Leads"
        subtitle="Manage your pipeline from first enquiry to received order"
      >
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Client
        </Button>
      </PageHeader>

      <section className="stat-strip" aria-label="Client metrics" style={{ marginBottom: 24 }}>
        {stats.map((stat) => (
          <div key={stat.label} className="strip-item">
            <span className="strip-label">{stat.label}</span>
            <span className="strip-value">{stat.value}</span>
          </div>
        ))}
      </section>

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search clients, contacts, cities..."
          ariaLabel="Search clients"
        />
        <Dropdown
          label={status}
          value={status}
          options={STATUS_OPTIONS}
          onSelect={(value) => {
            setStatus(value);
            setPage(1);
          }}
          align="left"
          ariaLabel="Filter by status"
        />
        <Dropdown
          label={category}
          value={category}
          options={CATEGORIES}
          onSelect={(value) => {
            setCategory(value);
            setPage(1);
          }}
          ariaLabel="Filter by category"
        />
      </div>

      <Card className="table-card">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyIcon={Users}
          emptyTitle="No clients found"
          emptyDescription="Adjust the filters or add your first client."
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="clients"
        />
      </Card>

      {/* Add / Edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Client" : "Add Client"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClient} disabled={!form.name.trim() || !form.contact.trim()}>
              {editing ? "Save Changes" : "Add Client"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="client-name">Company Name</label>
            <input
              id="client-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Apex Pharma"
            />
          </div>
          <div className="field">
            <label htmlFor="client-contact">Contact Person</label>
            <input
              id="client-contact"
              value={form.contact}
              onChange={(event) => setForm({ ...form, contact: event.target.value })}
              placeholder="e.g. Mr. Rahul Sharma"
            />
          </div>
          <div className="field">
            <label htmlFor="client-phone">Phone</label>
            <input
              id="client-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+91 ..."
            />
          </div>
          <div className="field">
            <label htmlFor="client-email">Email</label>
            <input
              id="client-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="name@company.com"
            />
          </div>
          <div className="field">
            <label htmlFor="client-category">Category</label>
            <select
              id="client-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {CATEGORIES.slice(1).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="client-city">City</label>
            <input
              id="client-city"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              placeholder="e.g. Mumbai"
            />
          </div>
          <div className="field full">
            <label htmlFor="client-notes">Notes</label>
            <textarea
              id="client-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Anything useful for the next call..."
            />
          </div>
        </div>
        <p className="form-note">Stored locally in this session — no backend connected.</p>
      </Modal>

      {/* Details */}
      <Modal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title={details?.name ?? ""}
        wide
      >
        {details && (
          <>
            <dl className="detail-list">
              <div>
                <dt>Contact Person</dt>
                <dd>{details.contact}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{details.phone}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{details.email}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{details.category}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{details.city}</dd>
              </div>
              <div>
                <dt>Last Contact</dt>
                <dd>{details.lastContact}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={details.status} />
                </dd>
              </div>
            </dl>
            {details.notes && (
              <p className="followup-notes" style={{ marginTop: 20 }}>
                {details.notes}
              </p>
            )}
          </>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete client?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setClients((list) => list.filter((c) => c.id !== deleting.id));
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-muted">
          <strong>{deleting?.name}</strong> will be removed from your client list.
        </p>
      </Modal>
    </>
  );
}
