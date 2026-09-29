/* Quotation persistence + business rules.
   Records live in localStorage until a backend is connected; the saved shape
   stays compatible with the V BIOCHEM data model:
   { number, status, date, currency, rate, freight, paymentTerms, items[] }
   items: [{ desc, hsn, qty, timeline, price }] */

const STORAGE_KEY = "vbiochem.quotations";
const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

export const IGST_RATE = 0.18;
export const DEFAULT_USD_RATE = 83.2;

/* ---------------- Formatting ---------------- */

export function formatAmount(value, currency = "INR") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatAmountExact(value, currency = "INR") {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  /* Hand-built so it always reads "28 Sep 2026" (CLDR renders "Sept" in
     several English locales and en-US puts the month first). */
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${day} ${month} ${date.getFullYear()}`;
}

export function toISODate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ---------------- Calculations ---------------- */

/**
 * Compute quotation totals in the quotation currency, plus INR
 * equivalents when the quotation is denominated in USD.
 */
export function computeTotals({ items = [], currency = "INR", rate = 1, freight = 0 }) {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
    0
  );
  const tax = subtotal * IGST_RATE;
  const freightValue = Number(freight) || 0;
  const grandTotal = subtotal + tax + freightValue;

  const inr =
    currency === "USD"
      ? {
          rate: Number(rate) || DEFAULT_USD_RATE,
          subtotal: subtotal * (Number(rate) || DEFAULT_USD_RATE),
          tax: tax * (Number(rate) || DEFAULT_USD_RATE),
          freight: freightValue * (Number(rate) || DEFAULT_USD_RATE),
          grandTotal: grandTotal * (Number(rate) || DEFAULT_USD_RATE),
        }
      : null;

  return { subtotal, tax, taxRate: IGST_RATE, freight: freightValue, grandTotal, inr };
}

/* ---------------- Validation ---------------- */

/**
 * Validate a quotation form before saving (drafts skip this).
 * Returns { valid, client, number, currency, itemsList, items: { [id]: {...} } }
 */
export function validateQuotation(form) {
  const errors = { items: {} };

  if (!form.client) errors.client = "Select a client to continue.";
  if (!form.number?.trim()) errors.number = "Quotation number is required.";
  if (!form.currency) errors.currency = "Select a currency.";

  if (!form.items.length) {
    errors.itemsList = "Add at least one product or compound.";
  } else {
    form.items.forEach((item) => {
      const rowErrors = {};
      if (!item.desc?.trim()) {
        rowErrors.desc = "Product not found — pick a suggestion or type a name.";
      }
      const qty = Number(item.qty);
      if (item.qty === "" || item.qty === null || Number.isNaN(qty) || qty <= 0) {
        rowErrors.qty = "Qty must be > 0.";
      }
      const price = Number(item.price);
      if (item.price === "" || item.price === null || Number.isNaN(price) || price < 0) {
        rowErrors.price = "Enter a valid price.";
      }
      if (Object.keys(rowErrors).length) errors.items[item.id] = rowErrors;
    });
  }

  errors.valid =
    !errors.client &&
    !errors.number &&
    !errors.currency &&
    !errors.itemsList &&
    Object.keys(errors.items).length === 0;

  return errors;
}

/* ---------------- Persistence ---------------- */

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function listQuotations() {
  await delay();
  try {
    const list = load().sort((a, b) =>
      String(b.updatedAt ?? b.date).localeCompare(String(a.updatedAt ?? a.date))
    );
    return { ok: true, items: list };
  } catch {
    return { ok: false, error: "Could not load quotations." };
  }
}

export async function getQuotation(number) {
  await delay();
  try {
    const record = load().find((entry) => entry.number === number) ?? null;
    return { ok: true, record };
  } catch {
    return { ok: false, error: "Could not load this quotation." };
  }
}

export async function nextQuotationNumber() {
  await delay(180);
  try {
    const year = new Date().getFullYear();
    const prefix = `VBQ-${year}-`;
    const used = load()
      .filter((entry) => entry.number?.startsWith(prefix))
      .map((entry) => Number(entry.number.slice(prefix.length)) || 0);
    const next = (used.length ? Math.max(...used) : 0) + 1;
    return { ok: true, number: `${prefix}${String(next).padStart(3, "0")}` };
  } catch {
    return { ok: false, error: "Could not generate a quotation number." };
  }
}

/**
 * Save a quotation (or draft) against the selected client.
 * @returns {{ok: true, record: object}|{ok: false, error: string}}
 */
export async function saveQuotation(form, { status = "Saved", editing = false } = {}) {
  await delay(500); /* simulate a network round-trip */
  try {
    const list = load();
    const duplicate = list.find(
      (entry) => entry.number === form.number && (!editing || entry.id !== form.id)
    );
    if (duplicate) {
      return {
        ok: false,
        error: `Quotation ${form.number} already exists. Use a different number.`,
      };
    }

    const totals = computeTotals(form);
    const now = new Date().toISOString();
    const record = {
      /* core V BIOCHEM quotation shape */
      number: form.number,
      status,
      date: form.date,
      currency: form.currency,
      rate: form.currency === "USD" ? Number(form.rate) || DEFAULT_USD_RATE : 1,
      freight: Number(form.freight) || 0,
      paymentTerms: form.paymentTerms === "Custom" ? form.customTerms || "Custom" : form.paymentTerms,
      items: form.items.map((item) => ({
        desc: item.desc,
        hsn: item.hsn,
        qty: Number(item.qty) || 0,
        timeline: item.timeline,
        price: Number(item.price) || 0,
        unit: item.unit,
      })),
      /* supporting detail */
      id: editing && form.id ? form.id : `Q-${Date.now()}`,
      client: form.client,
      validUntil: form.validUntil,
      deliveryTimeline: form.deliveryTimeline,
      notes: form.notes,
      termsNotes: form.termsNotes,
      totals: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        freight: totals.freight,
        grandTotal: totals.grandTotal,
      },
      createdAt: editing && form.createdAt ? form.createdAt : now,
      updatedAt: now,
    };

    const nextList = editing
      ? list.map((entry) => (entry.id === record.id ? record : entry))
      : [record, ...list];
    persist(nextList);

    return { ok: true, record };
  } catch {
    return {
      ok: false,
      error: "Failed to save the quotation. Please try again.",
    };
  }
}

export async function deleteQuotation(number) {
  await delay(200);
  try {
    persist(load().filter((entry) => entry.number !== number));
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete this quotation." };
  }
}
