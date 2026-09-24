import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Card, CardHeader } from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import Dropdown from "../common/Dropdown";
import EmptyState from "../common/EmptyState";
import { recentBills } from "../../data/billsData";

const STATUS_OPTIONS = ["All Statuses", "Paid", "Pending", "Overdue"];
const SORT_OPTIONS = ["Newest First", "Oldest First", "Amount: High → Low", "Amount: Low → High"];

const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const MONTH_INDEX = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function dateValue(dateString) {
  const [day, month, year] = dateString.split(" ");
  return new Date(Number(year), MONTH_INDEX[month] ?? 0, Number(day)).getTime();
}

export default function RecentBills() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [sort, setSort] = useState(SORT_OPTIONS[0]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = recentBills.filter((bill) => {
      const matchesStatus = status === STATUS_OPTIONS[0] || bill.status === status;
      const matchesQuery =
        !q ||
        bill.billNo.toLowerCase().includes(q) ||
        bill.client.toLowerCase().includes(q) ||
        bill.description.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "Oldest First":
          return dateValue(a.date) - dateValue(b.date);
        case "Amount: High → Low":
          return b.amount - a.amount;
        case "Amount: Low → High":
          return a.amount - b.amount;
        case "Newest First":
        default:
          return dateValue(b.date) - dateValue(a.date);
      }
    });

    return list;
  }, [query, status, sort]);

  return (
    <Card className="table-card recent-card">
      <CardHeader
        title="Recent Bills"
        subtitle="Latest invoicing activity"
        action={
          <div className="card-controls">
            <div className="search-input control-search">
              <Search size={15} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                aria-label="Search recent bills"
              />
            </div>
            <Dropdown
              label="Filter"
              value={status}
              options={STATUS_OPTIONS}
              onSelect={setStatus}
              ariaLabel="Filter by status"
            />
            <Dropdown
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onSelect={setSort}
              ariaLabel="Sort bills"
            />
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No bills match your filters"
          description="Adjust the search or filter criteria to see bills again."
        />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Client</th>
                <th>Product / Description</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((bill) => (
                <tr key={bill.id}>
                  <td className="cell-primary mono">{bill.billNo}</td>
                  <td>{bill.client}</td>
                  <td className="cell-desc">{bill.description}</td>
                  <td className="mono" style={{ textAlign: "right" }}>
                    {CURRENCY.format(bill.amount)}
                  </td>
                  <td>{bill.date}</td>
                  <td>
                    <StatusBadge status={bill.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="recent-footer">
        <span className="pagination-info">
          Showing {rows.length} of {recentBills.length} bills
        </span>
        <span className="card-link-quiet">
          <ArrowUpDown size={13} aria-hidden="true" /> {sort}
        </span>
      </div>
    </Card>
  );
}
