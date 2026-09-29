/* Purchase Order data access + business rules for the PO Management module.
   Record shape stays compatible with the V BIOCHEM PO structure:
   { month, poNumber, totalCompounds, billedCompounds, amount, billNo, remarks, dateAdded }
   `company` / `billLink` are additive, backward-compatible fields.

   Swap the async functions for API calls when a backend is connected. */

import { formatDate } from "./quotationService";

export { formatDate };

const STORAGE_KEY = "vbiochem.purchaseorders";
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* ---------------- Seed ---------------- */
/* [company, YYYY-MM, totalCompounds, billedCompounds, amount] — demo data
   only; the matrix and KPIs are always computed from the stored records. */
const SEED_ROWS = [
  /* 2026 — 48 POs across the existing Clients list */
  ["Apex Pharma", "2026-01", 20, 20, 120000],
  ["Apex Pharma", "2026-02", 24, 24, 250000],
  ["Apex Pharma", "2026-03", 16, 16, 180000],
  ["Apex Pharma", "2026-05", 30, 18, 320000],
  ["Apex Pharma", "2026-06", 18, 18, 210000],
  ["Apex Pharma", "2026-08", 14, 6, 150000],
  ["Apex Pharma", "2026-09", 26, 26, 280000],
  ["Synergy Labs", "2026-01", 8, 8, 95000],
  ["Synergy Labs", "2026-02", 12, 12, 150000],
  ["Synergy Labs", "2026-03", 20, 20, 230000],
  ["Synergy Labs", "2026-04", 12, 12, 140000],
  ["Synergy Labs", "2026-06", 10, 4, 120000],
  ["Synergy Labs", "2026-07", 22, 22, 250000],
  ["Synergy Labs", "2026-08", 14, 14, 165000],
  ["Synergy Labs", "2026-09", 15, 8, 180000],
  ["Global Biotech", "2026-01", 15, 15, 150000],
  ["Global Biotech", "2026-03", 20, 20, 220000],
  ["Global Biotech", "2026-04", 10, 0, 110000],
  ["Global Biotech", "2026-05", 16, 16, 190000],
  ["Global Biotech", "2026-06", 12, 12, 130000],
  ["Global Biotech", "2026-07", 28, 28, 310000],
  ["Global Biotech", "2026-08", 24, 12, 250000],
  ["Global Biotech", "2026-09", 22, 0, 240000],
  ["HealthChem Pvt Ltd", "2026-02", 14, 14, 175000],
  ["HealthChem Pvt Ltd", "2026-03", 17, 17, 195000],
  ["HealthChem Pvt Ltd", "2026-04", 22, 22, 260000],
  ["HealthChem Pvt Ltd", "2026-05", 11, 5, 145000],
  ["HealthChem Pvt Ltd", "2026-07", 18, 18, 205000],
  ["HealthChem Pvt Ltd", "2026-08", 9, 9, 120000],
  ["HealthChem Pvt Ltd", "2026-09", 16, 0, 210000],
  ["Nova Therapeutics", "2026-01", 19, 19, 230000],
  ["Nova Therapeutics", "2026-03", 10, 6, 140000],
  ["Nova Therapeutics", "2026-05", 23, 23, 275000],
  ["Nova Therapeutics", "2026-06", 15, 15, 185000],
  ["Nova Therapeutics", "2026-07", 13, 4, 160000],
  ["Nova Therapeutics", "2026-08", 25, 25, 295000],
  ["Nova Therapeutics", "2026-09", 11, 11, 130000],
  ["Zenith Labs", "2026-02", 9, 9, 110000],
  ["Zenith Labs", "2026-04", 14, 0, 170000],
  ["Zenith Labs", "2026-06", 21, 21, 240000],
  ["Zenith Labs", "2026-07", 8, 8, 95000],
  ["Zenith Labs", "2026-08", 17, 10, 205000],
  ["Zenith Labs", "2026-09", 13, 13, 155000],
  ["Medilife", "2026-03", 7, 7, 105000],
  ["Medilife", "2026-05", 12, 12, 160000],
  ["Medilife", "2026-06", 6, 0, 90000],
  ["Medilife", "2026-08", 10, 10, 140000],
  ["Medilife", "2026-09", 15, 15, 175000],
  /* 2025 — gives the year filter something to switch to */
  ["Nova Therapeutics", "2025-10", 28, 28, 310000],
  ["Apex Pharma", "2025-11", 20, 20, 190000],
  ["Global Biotech", "2025-11", 22, 22, 260000],
  ["Synergy Labs", "2025-12", 15, 15, 145000],
  ["HealthChem Pvt Ltd", "2025-12", 12, 0, 125000],
  ["Zenith Labs", "2025-12", 10, 4, 95000],
];

const DAY_CYCLE = [5, 12, 19, 26];

function remarksFor(total, billed) {
  if (billed <= 0) return "Billing not started.";
  if (billed < total) return "Partially billed — balance pending.";
  return "All compounds delivered and billed.";
}

function buildSeed() {
  const sorted = SEED_ROWS.map((row, index) => ({
    company: row[0],
    yearMonth: row[1],
    totalCompounds: row[2],
    billedCompounds: row[3],
    amount: row[4],
    day: DAY_CYCLE[index % DAY_CYCLE.length],
  })).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

  const yearSeq = {};
  let billSeq = 0;

  return sorted.map((row) => {
    const year = row.yearMonth.slice(0, 4);
    yearSeq[year] = (yearSeq[year] ?? 0) + 1;
    const poNumber = `PO-${year}-${String(yearSeq[year]).padStart(3, "0")}`;
    const dateAdded = `${row.yearMonth}-${String(row.day).padStart(2, "0")}`;
    const billed = row.billedCompounds;
    const billNo = billed > 0 ? `INV-${String((billSeq += 1)).padStart(3, "0")}` : "";

    return {
      /* core V BIOCHEM PO fields */
      month: MONTHS[Number(row.yearMonth.slice(5, 7)) - 1],
      poNumber,
      totalCompounds: row.totalCompounds,
      billedCompounds: billed,
      amount: row.amount,
      billNo,
      remarks: remarksFor(row.totalCompounds, billed),
      dateAdded,
      /* additive, backward-compatible fields */
      company: row.company,
      billLink: "",
      id: poNumber,
    };
  });
}

/* ---------------- Persistence ---------------- */

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  const seed = buildSeed();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable — still serve the seed for this session */
  }
  return seed;
}

function persist(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------------- Derived values ---------------- */

/** Status is derived from billing counts — never stored or hand-entered. */
export function statusOf(po) {
  const total = Number(po?.totalCompounds) || 0;
  const billed = Number(po?.billedCompounds) || 0;
  if (billed <= 0) return "Pending";
  if (billed >= total) return "Completed";
  return "Partial";
}

export function progressOf(po) {
  const total = Number(po?.totalCompounds) || 0;
  const billed = Math.min(Number(po?.billedCompounds) || 0, total);
  const percent = total > 0 ? Math.round((billed / total) * 100) : 0;
  return { billed, total, percent, status: statusOf(po) };
}

export function yearOf(po) {
  return (po?.dateAdded ?? "").slice(0, 4);
}

export function monthIndexOf(po) {
  const index = MONTHS.indexOf(po?.month);
  return index >= 0 ? index : Number((po?.dateAdded ?? "").slice(5, 7)) - 1;
}

/* ---------------- Formatting ---------------- */

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

/** Matrix / compact cells: 120000 → "1.2L", 0 → "0". */
export function formatLakh(value) {
  const amount = Number(value) || 0;
  if (amount === 0) return "0";
  return `${(amount / 1e5).toFixed(1)}L`;
}

/** KPI headline: 2840000 → "₹28.40 L". */
export function formatLakhValue(value) {
  return `₹${((Number(value) || 0) / 1e5).toFixed(2)} L`;
}

export function formatDateLong(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  return `${day} ${month} ${date.getFullYear()}`;
}

/** Local-timezone ISO date (YYYY-MM-DD) for defaults. */
export function todayISO(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ---------------- Validation ---------------- */

export function validatePO(input) {
  const errors = {};
  const total = Number(input.totalCompounds);
  const billed = Number(input.billedCompounds);
  const amount = Number(input.amount);

  if (!input.company?.trim()) errors.company = "Select a company.";
  if (!input.poNumber?.trim()) errors.poNumber = "PO number is required.";
  if (!input.dateAdded) errors.dateAdded = "PO date is required.";

  if (input.totalCompounds === "" || Number.isNaN(total) || total < 0) {
    errors.totalCompounds = "Enter total compounds.";
  }
  if (input.billedCompounds === "" || Number.isNaN(billed) || billed < 0) {
    errors.billedCompounds = "Enter billed compounds.";
  } else if (!errors.totalCompounds && billed > total) {
    errors.billedCompounds = "Billed Compounds cannot exceed Total Compounds.";
  }
  if (input.amount === "" || Number.isNaN(amount) || amount < 0) {
    errors.amount = "Enter a valid amount.";
  }
  if (input.billLink?.trim() && !/^(https?:\/\/|www\.)/i.test(input.billLink.trim())) {
    errors.billLink = "Link must start with http:// or https://.";
  }

  errors.valid = Object.keys(errors).length === 0;
  return errors;
}

/* ---------------- CRUD ---------------- */

export async function listPOs() {
  await delay(320);
  try {
    const items = load().sort((a, b) =>
      String(b.dateAdded).localeCompare(String(a.dateAdded))
    );
    return { ok: true, items };
  } catch {
    return { ok: false, error: "Unable to load purchase orders." };
  }
}

export async function nextPONumber() {
  await delay(120);
  try {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    const used = load()
      .filter((po) => po.poNumber?.startsWith(prefix))
      .map((po) => Number(po.poNumber.slice(prefix.length)) || 0);
    const next = (used.length ? Math.max(...used) : 0) + 1;
    return { ok: true, poNumber: `${prefix}${String(next).padStart(3, "0")}` };
  } catch {
    return { ok: false, error: "Could not generate a PO number." };
  }
}

function sanitize(input) {
  const dateAdded = input.dateAdded;
  return {
    company: input.company.trim(),
    poNumber: input.poNumber.trim(),
    /* month is derived from the PO date, but the stored value may be
       corrected by the user — keep whatever the form settled on. */
    month: input.month,
    dateAdded,
    totalCompounds: Number(input.totalCompounds) || 0,
    billedCompounds: Number(input.billedCompounds) || 0,
    amount: Number(input.amount) || 0,
    billNo: input.billNo?.trim() ?? "",
    billLink: input.billLink?.trim() ?? "",
    remarks: input.remarks?.trim() ?? "",
  };
}

export async function createPO(input) {
  await delay(400);
  try {
    const list = load();
    const number = input.poNumber.trim();
    if (list.some((po) => po.poNumber === number)) {
      return { ok: false, error: `${number} already exists. Use a different PO number.` };
    }
    const record = { ...sanitize(input), id: `PO-${Date.now()}` };
    persist([record, ...list]);
    return { ok: true, record };
  } catch {
    return { ok: false, error: "Unable to save purchase order. Please try again." };
  }
}

export async function updatePO(id, input) {
  await delay(400);
  try {
    const list = load();
    const number = input.poNumber.trim();
    if (list.some((po) => po.poNumber === number && po.id !== id)) {
      return { ok: false, error: `${number} already exists. Use a different PO number.` };
    }
    let updated = null;
    const next = list.map((po) => {
      if (po.id !== id) return po;
      updated = { ...po, ...sanitize(input), id };
      return updated;
    });
    if (!updated) return { ok: false, error: "Purchase order not found." };
    persist(next);
    return { ok: true, record: updated };
  } catch {
    return { ok: false, error: "Unable to save purchase order. Please try again." };
  }
}

export async function deletePO(id) {
  await delay(300);
  try {
    persist(load().filter((po) => po.id !== id));
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to delete purchase order. Please try again." };
  }
}

/* ---------------- Aggregations (all computed, never hardcoded) ---------------- */

/** KPI cards for a year, straight from the PO records. */
export function computeKPIs(items, year) {
  const inYear = items.filter((po) => yearOf(po) === String(year));
  const totalValue = inYear.reduce((sum, po) => sum + (Number(po.amount) || 0), 0);
  const pendingBilling = inYear.filter((po) => statusOf(po) !== "Completed").length;
  const totalCompounds = inYear.reduce((s, po) => s + (Number(po.totalCompounds) || 0), 0);
  const billedCompounds = inYear.reduce((s, po) => s + (Number(po.billedCompounds) || 0), 0);
  const billedPercent = totalCompounds > 0
    ? Math.round((billedCompounds / totalCompounds) * 100)
    : 0;

  /* Month-over-month value trend inside the selected year. */
  const monthly = Array(12).fill(0);
  inYear.forEach((po) => {
    const index = monthIndexOf(po);
    if (index >= 0) monthly[index] += Number(po.amount) || 0;
  });
  let trend = null;
  for (let i = 11; i >= 0; i -= 1) {
    if (monthly[i] > 0) {
      const previous = i > 0 ? monthly[i - 1] : 0;
      trend = previous > 0
        ? Math.round(((monthly[i] - previous) / previous) * 100)
        : null;
      break;
    }
  }

  return { totalValue, count: inYear.length, pendingBilling, billedPercent, trend };
}

/** Company × month matrix with row/column/grand totals. */
export function buildMonthlyMatrix(items, { year, company = "All Companies" } = {}) {
  const inScope = items.filter(
    (po) =>
      yearOf(po) === String(year) &&
      (company === "All Companies" || po.company === company)
  );

  const byCompany = new Map();
  inScope.forEach((po) => {
    if (!po.company) return;
    if (!byCompany.has(po.company)) byCompany.set(po.company, Array(12).fill(0));
    const index = monthIndexOf(po);
    if (index >= 0) byCompany.get(po.company)[index] += Number(po.amount) || 0;
  });

  const rows = [...byCompany.entries()]
    .map(([name, values]) => ({
      company: name,
      values,
      total: values.reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => b.total - a.total);

  const totals = Array(12).fill(0);
  rows.forEach((row) => row.values.forEach((value, index) => {
    totals[index] += value;
  }));
  const grand = totals.reduce((sum, value) => sum + value, 0);

  return { year: String(year), rows, totals, grand };
}

/* ---------------- Export ---------------- */

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toCSV(header, rows) {
  return [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function matrixToCSV(matrix) {
  const header = ["Company", ...MONTHS, "Total"];
  const rows = matrix.rows.map((row) => [row.company, ...row.values, row.total]);
  rows.push(["TOTAL", ...matrix.totals, matrix.grand]);
  return toCSV(header, rows);
}

export function posToCSV(items) {
  const header = [
    "PO Number", "Company", "Month", "PO Date",
    "Total Compounds", "Billed Compounds", "Billing Progress (%)",
    "Amount (INR)", "Bill No.", "Status", "Remarks",
  ];
  const rows = items.map((po) => {
    const progress = progressOf(po);
    return [
      po.poNumber,
      po.company,
      po.month,
      po.dateAdded,
      po.totalCompounds,
      po.billedCompounds,
      progress.percent,
      po.amount,
      po.billNo || "",
      progress.status,
      po.remarks || "",
    ];
  });
  return toCSV(header, rows);
}

export function downloadCSV(filename, csv) {
  /* BOM keeps Excel happy with ₹ and unicode. */
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
