/* Product data access for the quotation builder.
   Backed by the Products Master list plus a supplementary compounds catalog.
   Swap these functions for real API calls when a backend is connected. */

import { products } from "../data/productsData";

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

/* Supplementary pharmaceutical compounds / APIs used by the quotation module.
   Kept here (not in Products Master) so the existing Products page is untouched. */
const compounds = [
  { id: "CMP-2001", name: "Paracetamol", code: "API-PARA-500", hsn: "3004", price: 1200, unit: "Kg", timeline: "2–4 Weeks" },
  { id: "CMP-2002", name: "Paracetamol API", code: "API-PARA-250", hsn: "3004", price: 1450, unit: "Kg", timeline: "2–4 Weeks" },
  { id: "CMP-2003", name: "Paracetamol Intermediate", code: "INT-PARA-01", hsn: "2924", price: 980, unit: "Kg", timeline: "3–4 Weeks" },
  { id: "CMP-2004", name: "Ibuprofen", code: "API-IBU-500", hsn: "3004", price: 2500, unit: "Kg", timeline: "2–4 Weeks" },
  { id: "CMP-2005", name: "Ibuprofen API", code: "API-IBU-250", hsn: "3004", price: 2850, unit: "Kg", timeline: "2–4 Weeks" },
  { id: "CMP-2006", name: "Caffeine Anhydrous", code: "API-CAF-100", hsn: "2939", price: 1850, unit: "Kg", timeline: "2–4 Weeks" },
  { id: "CMP-2007", name: "Ofloxacin", code: "API-OFL-100", hsn: "3004", price: 3200, unit: "Kg", timeline: "3–4 Weeks" },
];

/* Products Master does not carry HSN/timeline fields yet — derive sensible
   defaults from the category so the autocomplete can still show them. */
const CATEGORY_HSN = {
  Solvents: "2909",
  Reagents: "2833",
  "Acids & Bases": "2807",
  "Lab Plastics": "3926",
  Indicators: "3822",
};

const FAST_CATEGORIES = new Set(["Lab Plastics", "Indicators"]);

function unitFromPackage(unit = "") {
  const value = unit.toLowerCase();
  if (value.includes("ml")) return "ml";
  if (value.includes("l") && !value.includes("packs")) return "L";
  if (value.includes("pcs")) return "pcs";
  if (value.includes("packs")) return "packs";
  if (value.includes("g")) return "g";
  return "unit";
}

function fromMaster(product) {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    hsn: CATEGORY_HSN[product.category] ?? "3004",
    timeline: FAST_CATEGORIES.has(product.category) ? "3–5 Days" : "2–4 Weeks",
    price: product.price,
    unit: unitFromPackage(product.unit),
    source: "master",
  };
}

function fromCompound(compound) {
  return { ...compound, source: "compound" };
}

function matches(entry, query) {
  const q = query.toLowerCase();
  return (
    entry.name.toLowerCase().includes(q) ||
    entry.code.toLowerCase().includes(q) ||
    entry.hsn.includes(q)
  );
}

/**
 * Search the quotation product catalog.
 * @returns {{ok: true, items: Array}|{ok: false, error: string}}
 */
export async function searchProducts(query = "") {
  await delay();
  try {
    const all = [...compounds.map(fromCompound), ...products.map(fromMaster)];
    const trimmed = query.trim();
    const found = trimmed
      ? all.filter((entry) => matches(entry, trimmed))
      : all;

    /* Exact-prefix matches first so "Para" lists Paracetamol variants first. */
    found.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(trimmed.toLowerCase()) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(trimmed.toLowerCase()) ? 0 : 1;
      return aStarts - bStarts;
    });

    return { ok: true, items: found.slice(0, 8) };
  } catch {
    return {
      ok: false,
      error: "Could not load products. Please try again.",
    };
  }
}
