/* Client data access for the quotation builder.
   Seeded from the Clients & Leads mock list, plus clients created inline
   from the quotation page (persisted in localStorage until a backend exists). */

import { clients as seedClients } from "../data/clientsData";

const STORAGE_KEY = "vbiochem.clients.custom";
const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

function loadCustomClients() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCustomClients(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Map any stored client record onto the quotation client shape. */
export function normalizeClient(record) {
  return {
    id: record.id,
    company: record.company ?? record.name ?? "",
    contact: record.contact ?? record.contactPerson ?? "",
    address: record.address ?? record.city ?? "",
  };
}

/**
 * All known clients as the normalized quotation/PO company shape.
 * Synchronous — used by pickers that filter locally.
 */
export function listClients() {
  return [
    ...seedClients.map(normalizeClient),
    ...loadCustomClients().map(normalizeClient),
  ];
}

/**
 * Search clients by company / contact / address.
 * @returns {{ok: true, items: Array}|{ok: false, error: string}}
 */
export async function searchClients(query = "") {
  await delay();
  try {
    const all = [
      ...seedClients.map(normalizeClient),
      ...loadCustomClients().map(normalizeClient),
    ];
    const q = query.trim().toLowerCase();
    const items = q
      ? all.filter(
          (client) =>
            client.company.toLowerCase().includes(q) ||
            client.contact.toLowerCase().includes(q) ||
            client.address.toLowerCase().includes(q)
        )
      : all;
    return { ok: true, items: items.slice(0, 8) };
  } catch {
    return { ok: false, error: "Could not load clients. Please try again." };
  }
}

/**
 * Create a new client from the "Add New Client" modal.
 * @returns {{ok: true, client: object}|{ok: false, error: string}}
 */
export async function createClient({ company, contact, address }) {
  await delay(300);
  const trimmedCompany = (company ?? "").trim();
  if (!trimmedCompany) {
    return { ok: false, error: "Company name is required." };
  }
  try {
    const client = {
      id: `C-${Date.now()}`,
      company: trimmedCompany,
      contact: (contact ?? "").trim(),
      address: (address ?? "").trim(),
    };
    persistCustomClients([...loadCustomClients(), client]);
    return { ok: true, client };
  } catch {
    return {
      ok: false,
      error: "Could not save client — local storage is unavailable.",
    };
  }
}
