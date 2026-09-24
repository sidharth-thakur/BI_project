import { useMemo, useState } from "react";
import { Plus, Package, Pencil, Trash2, Eye } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import SearchInput from "../../components/common/SearchInput";
import Dropdown from "../../components/common/Dropdown";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import DataTable from "../../components/tables/DataTable";
import Pagination from "../../components/tables/Pagination";
import { products as initialProducts, productCategories } from "../../data/productsData";

const PAGE_SIZE = 8;
const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const EMPTY_FORM = {
  code: "",
  name: "",
  category: "Solvents",
  unit: "",
  price: "",
  stock: "",
};

function stockStatus(stock) {
  if (stock <= 0) return "Out of Stock";
  if (stock < 20) return "Low Stock";
  return "In Stock";
}

export default function ProductsMaster() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product id or null
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState(null); // product or null
  const [viewing, setViewing] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "All Categories" || product.category === category;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, search, category]);

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

  function openEdit(product) {
    setEditing(product.id);
    setForm({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: String(product.price),
      stock: String(product.stock),
    });
    setFormOpen(true);
  }

  function saveProduct() {
    if (!form.name.trim() || !form.code.trim()) return;

    const price = Number(form.price) || 0;
    const stock = Number(form.stock) || 0;
    const base = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim() || "1 unit",
      price,
      stock,
      status: stockStatus(stock),
    };

    if (editing) {
      setProducts((list) =>
        list.map((product) =>
          product.id === editing ? { ...product, ...base } : product
        )
      );
    } else {
      setProducts((list) => [
        { id: `P-${Date.now()}`, ...base },
        ...list,
      ]);
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    setProducts((list) => list.filter((product) => product.id !== deleting.id));
    setDeleting(null);
  }

  const columns = [
    {
      key: "name",
      label: "Product",
      primary: true,
      render: (product) => (
        <span className="cell-stack">
          {product.name}
          <small>{product.code}</small>
        </span>
      ),
    },
    { key: "category", label: "Category" },
    { key: "unit", label: "Unit" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (product) => <span className="mono">{CURRENCY.format(product.price)}</span>,
    },
    {
      key: "stock",
      label: "Stock",
      align: "right",
      render: (product) => <span className="mono">{product.stock}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (product) => (
        <div className="table-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label={`View ${product.name}`}
            onClick={() => setViewing(product)}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Edit ${product.name}`}
            onClick={() => openEdit(product)}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={`Delete ${product.name}`}
            onClick={() => setDeleting(product)}
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
        title="Products Master"
        subtitle={`${products.length} products across ${productCategories.length - 1} categories`}
      >
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Product
        </Button>
      </PageHeader>

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name, code or category..."
          ariaLabel="Search products"
        />
        <Dropdown
          label={category}
          value={category}
          options={productCategories}
          onSelect={(value) => {
            setCategory(value);
            setPage(1);
          }}
          align="left"
          ariaLabel="Filter by category"
        />
      </div>

      <Card className="table-card">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyIcon={Package}
          emptyTitle="No products found"
          emptyDescription="Try a different search or add a new product."
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={filtered.length}
          onPageChange={setPage}
          itemLabel="products"
        />
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProduct} disabled={!form.name.trim() || !form.code.trim()}>
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div className="field">
            <label htmlFor="product-code">Product Code</label>
            <input
              id="product-code"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="e.g. SOL-ACE-500"
            />
          </div>
          <div className="field">
            <label htmlFor="product-category">Category</label>
            <select
              id="product-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {productCategories.slice(1).map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="product-name">Product Name</label>
            <input
              id="product-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Acetone (ACS Grade)"
            />
          </div>
          <div className="field">
            <label htmlFor="product-unit">Unit</label>
            <input
              id="product-unit"
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
              placeholder="e.g. 500 ml"
            />
          </div>
          <div className="field">
            <label htmlFor="product-price">Price (₹)</label>
            <input
              id="product-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label htmlFor="product-stock">Stock</label>
            <input
              id="product-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              placeholder="0"
            />
          </div>
        </div>
        <p className="form-note">Saved locally in this session — no backend connected.</p>
      </Modal>

      {/* View modal */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ""}
      >
        {viewing && (
          <dl className="detail-list">
            <div>
              <dt>Code</dt>
              <dd>{viewing.code}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{viewing.category}</dd>
            </div>
            <div>
              <dt>Unit</dt>
              <dd>{viewing.unit}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{CURRENCY.format(viewing.price)}</dd>
            </div>
            <div>
              <dt>Stock</dt>
              <dd>{viewing.stock}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={viewing.status} />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete product?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-muted">
          <strong>{deleting?.name}</strong> will be removed from this list. This
          action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
