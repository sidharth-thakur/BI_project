import { useMemo, useState } from "react";
import { Plus, ReceiptText, Eye, Pencil, Trash2 } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Dropdown from "../../components/common/Dropdown";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/tables/DataTable";
import Pagination from "../../components/tables/Pagination";
import { bills as initialBills } from "../../data/billsData";
import { clients } from "../../data/clientsData";

const PAGE_SIZE = 6;
const STATUS_FILTERS = ["All Statuses", "Paid", "Pending", "Overdue"];

const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const EMPTY_FORM = {
  client: clients[0].name,
  date: "",
  dueDate: "",
  amount: "",
  status: "Pending",
};

export default function BillManagement() {
  const [bills, setBills] = useState(initialBills);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const stats = useMemo(() => {
    const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const byStatus = (value) => bills.filter((bill) => bill.status === value).length;
    return [
      { label: "Total Bills", value: bills.length },
      { label: "Paid", value: byStatus("Paid") },
      { label: "Pending", value: byStatus("Pending") },
      { label: "Overdue", value: byStatus("Overdue") },
      { label: "Total Billing Value", value: `₹${(total / 100000).toFixed(1)}L` },
    ];
  }, [bills]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bills.filter((bill) => {
      const matchesStatus = status === "All Statuses" || bill.status === status;
      const matchesQuery =
        !query ||
        bill.billNo.toLowerCase().includes(query) ||
        bill.client.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [bills, search, status]);

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

  function openEdit(bill) {
    setEditing(bill.id);
    setForm({
      client: bill.client,
      date: bill.date,
      dueDate: bill.dueDate,
      amount: String(bill.amount),
      status: bill.status,
    });
    setFormOpen(true);
  }

  function saveBill() {
    if (!form.amount.trim() || !form.date.trim()) return;

    const base = {
      client: form.client,
      date: form.date.trim(),
      dueDate: form.dueDate.trim() || "—",
      amount: Number(form.amount) || 0,
      status: form.status,
    };

    if (editing) {
      setBills((list) =>
        list.map((bill) => (bill.id === editing ? { ...bill, ...base } : bill))
      );
    } else {
      const nextNumber =
        Math.max(
          ...bills.map((bill) => Number(bill.billNo.replace(/\D/g, "")) || 0)
        ) + 1;
      setBills((list) => [
        { id: `B-${nextNumber}`, billNo: `B-${nextNumber}`, ...base },
        ...list,
      ]);
    }
    setFormOpen(false);
  }

  const columns = [
    { key: "billNo", label: "Bill No.", primary: true },
    { key: "client", label: "Client" },
    { key: "date", label: "Date" },
    { key: "dueDate", label: "Due Date" },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (bill) => <span className="mono">{CURRENCY.format(bill.amount)}</span>,
    },
    {
      key: "status",
      label: "Payment Status",
      render: (bill) => <StatusBadge status={bill.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (bill) => (
        <div className="table-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`View bill ${bill.billNo}`}
            onClick={() => setViewing(bill)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit bill ${bill.billNo}`}
            onClick={() => openEdit(bill)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete bill ${bill.billNo}`}
            onClick={() => setDeleting(bill)}
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
        title="Bill Management"
        subtitle="Track invoicing, dues and payment status"
      >
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Bill
        </Button>
      </PageHeader>

      <section className="stat-strip" aria-label="Billing metrics" style={{ marginBottom: 24 }}>
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
          placeholder="Search bill number or client..."
          ariaLabel="Search bills"
        />
        <Dropdown
          label={status}
          value={status}
          options={STATUS_FILTERS}
          onSelect={(value) => {
            setStatus(value);
            setPage(1);
          }}
          align="left"
          ariaLabel="Filter by payment status"
        />
      </div>

      <Card className="table-card">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyIcon={ReceiptText}
          emptyTitle="No bills found"
          emptyDescription="Adjust the filters or create a new bill."
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="bills"
        />
      </Card>

      {/* Add / Edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Bill" : "Add Bill"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBill} disabled={!form.amount.trim() || !form.date.trim()}>
              {editing ? "Save Changes" : "Add Bill"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="bill-client">Client</label>
            <select
              id="bill-client"
              value={form.client}
              onChange={(event) => setForm({ ...form, client: event.target.value })}
            >
              {clients.map((client) => (
                <option key={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bill-date">Bill Date</label>
            <input
              id="bill-date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              placeholder="e.g. 12 Sep 2025"
            />
          </div>
          <div className="field">
            <label htmlFor="bill-due">Due Date</label>
            <input
              id="bill-due"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              placeholder="e.g. 22 Sep 2025"
            />
          </div>
          <div className="field">
            <label htmlFor="bill-amount">Amount (₹)</label>
            <input
              id="bill-amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label htmlFor="bill-status">Payment Status</label>
            <select
              id="bill-status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option>Paid</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>
        <p className="form-note">Stored locally in this session — no backend connected.</p>
      </Modal>

      {/* View */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `Bill ${viewing.billNo}` : ""}
      >
        {viewing && (
          <dl className="detail-list">
            <div>
              <dt>Client</dt>
              <dd>{viewing.client}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{CURRENCY.format(viewing.amount)}</dd>
            </div>
            <div>
              <dt>Bill Date</dt>
              <dd>{viewing.date}</dd>
            </div>
            <div>
              <dt>Due Date</dt>
              <dd>{viewing.dueDate}</dd>
            </div>
            <div>
              <dt>Payment Status</dt>
              <dd>
                <StatusBadge status={viewing.status} />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* Delete */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete bill?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setBills((list) => list.filter((bill) => bill.id !== deleting.id));
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-muted">
          Bill <strong>{deleting?.billNo}</strong> for {deleting?.client} will be
          removed.
        </p>
      </Modal>
    </>
  );
}
