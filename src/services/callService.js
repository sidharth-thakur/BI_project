/* Call Center CRM data access + business rules.
   Customers are seeded from the existing Clients list and the legacy
   follow-up records, then extended backward-compatibly with CRM fields:
   { name, dept, lastEnq, nextFollow, status, phone, email, priority,
     assignedTo, callHistory: [{ date, time, outcome, notes, nextFollow }] }
   The original { name, dept, lastEnq, nextFollow, status } shape is kept.

   Swap the async functions for API calls when a backend is connected. */

import { clients as seedClients } from "../data/clientsData";
import { followUps as legacyFollowUps } from "../data/followupsData";

const STORAGE_KEY = "vbiochem.callcenter";
const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------------- Constants (configurable lists) ---------------- */

export const CALL_OUTCOMES = [
  "Connected",
  "No Answer",
  "Busy",
  "Interested",
  "Quotation Requested",
  "Follow-up Required",
  "Order Expected",
  "Not Interested",
  "Wrong Number",
  "Closed",
];

export const CRM_STATUSES = [
  "New",
  "Active",
  "Under Discussion",
  "Order Received",
  "No Response",
  "Closed",
];

export const PRIORITIES = ["High", "Medium", "Low"];

export const FOLLOWUP_OPTIONS = [
  "No Follow-up",
  "Tomorrow",
  "In 3 Days",
  "Next Week",
  "Custom Date",
];

export const CLOSE_REASONS = [
  "Order Received",
  "Not Interested",
  "No Response",
  "Lost",
  "Other",
];

export const FOLLOW_FILTERS = [
  "All Follow-ups",
  "Today",
  "Overdue",
  "Tomorrow",
  "This Week",
  "Next Week",
  "Custom",
];

/* Configurable outcome → status mapping (conservative: only moves the
   status when the outcome clearly implies it). */
export const OUTCOME_STATUS_MAP = {
  Interested: "Under Discussion",
  "Quotation Requested": "Under Discussion",
  "Follow-up Required": "Under Discussion",
  "Not Interested": "Closed",
  "Wrong Number": "No Response",
  Closed: "Closed",
};

export const CLOSE_REASON_STATUS = {
  "Order Received": "Order Received",
  "Not Interested": "Closed",
  "No Response": "No Response",
  Lost: "Closed",
  Other: "Closed",
};

export const DORMANT_DAYS = 21;

/* ---------------- Date helpers ---------------- */

export function todayISO(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function daysSince(isoDate) {
  if (!isoDate) return null;
  const then = new Date(`${isoDate}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round((Date.now() - then) / 86400000));
}

export function formatDisplay(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${day} ${month} ${date.getFullYear()}`;
}

/** "HH:MM" (24h storage) → "3:30 PM"; passes legacy "10:30 AM" through. */
export function formatTime(value) {
  if (!value) return "";
  if (/^(AM|PM)$/i.test(value.slice(-2))) return value;
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${rawMinute ?? "00"} ${suffix}`;
}

export function currentTimeHHMM(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Queue label for a follow-up date. */
export function followLabel(isoDate, time) {
  if (!isoDate) return { text: "No follow-up scheduled", tone: "none" };
  const today = todayISO();
  const timeLabel = time ? ` · ${formatTime(time)}` : "";
  if (isoDate < today) return { text: `OVERDUE · ${formatDisplay(isoDate)}${timeLabel}`, tone: "overdue" };
  if (isoDate === today) return { text: `TODAY${timeLabel}`, tone: "today" };
  if (isoDate === addDays(today, 1)) return { text: `Tomorrow${timeLabel}`, tone: "soon" };
  return { text: `${formatDisplay(isoDate)}${timeLabel}`, tone: "future" };
}

export function initialsOf(name) {
  return String(name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/* ---------------- Seed ---------------- */

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Legacy follow-up records use "12 Sep 2025" strings. */
function parseLegacyDate(value) {
  const parts = String(value).split(" ");
  if (parts.length !== 3) return "";
  const month = MONTHS_SHORT.indexOf(parts[1]);
  if (month < 0) return "";
  return `${parts[2]}-${String(month + 1).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
}

/* Relative-to-today demo seed (offsets in days). Dates are generated at
   first load so the queue always demonstrates a realistic workday. */
const CUSTOMER_SEED = [
  {
    client: "Apex Pharma",
    dept: "Purchase",
    priority: "High",
    status: "Under Discussion",
    nextFollowIn: 0,
    nextFollowTime: "15:30",
    lastEnqIn: -4,
    history: [
      { d: 0, t: "10:15", outcome: "Connected", notes: "Requested revised quotation for API compounds." },
      { d: -4, t: "11:15", outcome: "Quotation Requested", notes: "Asked for API product quotation." },
      { d: -11, t: "16:00", outcome: "Interested", notes: "Interested in the new product range; catalogue shared." },
      { d: -24, t: "15:30", outcome: "Connected", notes: "Intro call — discussed solvents and reagents." },
      { d: -26, outcome: "Lead Created", notes: "Enquiry received via website.", type: "created" },
    ],
  },
  {
    client: "Synergy Labs",
    dept: "Purchase",
    priority: "High",
    status: "Under Discussion",
    nextFollowIn: -2,
    nextFollowTime: "11:00",
    lastEnqIn: -9,
    history: [
      { d: -9, t: "14:20", outcome: "Follow-up Required", notes: "Walked through bulk pricing options; management approval pending." },
      { d: -16, t: "12:05", outcome: "Quotation Requested", notes: "Requested bulk pricing for lab plastics." },
      { d: -30, outcome: "Lead Created", notes: "Existing client converted to follow-up track.", type: "created" },
    ],
  },
  {
    client: "HealthChem Pvt Ltd",
    dept: "Quality",
    priority: "Medium",
    status: "New",
    nextFollowIn: 0,
    nextFollowTime: "12:00",
    lastEnqIn: -2,
    history: [
      { d: -2, t: "09:45", outcome: "Connected", notes: "Enquired about the indicator range; price list sent." },
      { d: -8, t: "17:10", outcome: "No Answer", notes: "Called twice — no response." },
      { d: -25, outcome: "Lead Created", notes: "Fresh enquiry from website.", type: "created" },
    ],
  },
  {
    client: "Global Biotech",
    dept: "R&D",
    priority: "Medium",
    status: "Active",
    nextFollowIn: 1,
    nextFollowTime: "10:30",
    lastEnqIn: -6,
    history: [
      { d: -6, t: "15:40", outcome: "Interested", notes: "Sample evaluation in progress; wants COA documents." },
      { d: -13, t: "11:30", outcome: "Follow-up Required", notes: "Shared technical data sheet." },
      { d: -33, outcome: "Lead Created", notes: "Reference from an existing customer.", type: "created" },
    ],
  },
  {
    client: "Nova Therapeutics",
    dept: "Purchase",
    priority: "Low",
    status: "Order Received",
    nextFollowIn: 3,
    nextFollowTime: "14:00",
    lastEnqIn: -1,
    history: [
      { d: -1, t: "16:25", outcome: "Order Expected", notes: "PO to be issued this week for the acids contract." },
      { d: -8, t: "10:50", outcome: "Connected", notes: "Annual contract terms discussed." },
      { d: -40, outcome: "Lead Created", notes: "Annual contract renewal lead.", type: "created" },
    ],
  },
  {
    client: "Zenith Labs",
    dept: "Quality",
    priority: "Medium",
    status: "No Response",
    nextFollowIn: -6,
    nextFollowTime: "14:00",
    lastEnqIn: -20,
    history: [
      { d: -6, t: "13:05", outcome: "No Answer", notes: "Left voicemail — second attempt." },
      { d: -20, t: "10:20", outcome: "Busy", notes: "Call diverted; asked to call back later." },
      { d: -45, outcome: "Lead Created", notes: "Fresh enquiry from website.", type: "created" },
    ],
  },
  {
    client: "Medilife",
    dept: "Purchase",
    priority: "Low",
    status: "No Response",
    nextFollowIn: null,
    nextFollowTime: "",
    lastEnqIn: -45,
    history: [
      { d: -45, t: "12:40", outcome: "Not Interested", notes: "Not looking at new suppliers right now." },
      { d: -58, outcome: "Lead Created", notes: "Enquired about healthcare range.", type: "created" },
    ],
  },
  {
    client: "PureChem Industries",
    dept: "Procurement",
    priority: "Low",
    status: "New",
    nextFollowIn: null,
    nextFollowTime: "",
    lastEnqIn: -32,
    history: [
      { d: -32, t: "15:15", outcome: "No Answer", notes: "No response to the last two calls." },
      { d: -52, outcome: "Lead Created", notes: "Enquiry from trade fair.", type: "created" },
    ],
  },
];

function buildSeed() {
  const now = new Date();
  const isoOffset = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return todayISO(date);
  };

  return CUSTOMER_SEED.map((def, index) => {
    const client = seedClients.find((item) => item.name === def.client) ?? {};

    /* Legacy follow-up records become older timeline entries. */
    const legacyEntries = legacyFollowUps
      .filter((item) => item.client === def.client)
      .map((item, legacyIndex) => ({
        id: `L-${index}-${legacyIndex}`,
        date: parseLegacyDate(item.date),
        time: item.time,
        outcome: item.purpose,
        notes: item.notes,
        nextFollow: "",
        type: "legacy",
      }));

    const historyEntries = [
      ...def.history.map((entry, historyIndex) => ({
        id: `H-${index}-${historyIndex}`,
        date: isoOffset(entry.d),
        time: entry.t ?? "10:00",
        outcome: entry.outcome,
        notes: entry.notes,
        nextFollow: "",
        type: entry.type ?? "call",
      })),
      ...legacyEntries,
    ]
      .filter((entry) => entry.date)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    return {
      /* existing V BIOCHEM contact shape */
      name: def.client,
      dept: def.dept,
      lastEnq: isoOffset(def.lastEnqIn),
      nextFollow: def.nextFollowIn === null ? "" : isoOffset(def.nextFollowIn),
      status: def.status,
      /* backward-compatible CRM extensions */
      id: `CRM-${String(index + 1).padStart(3, "0")}`,
      contact: client.contact ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      city: client.city ?? "",
      category: client.category ?? "",
      priority: def.priority,
      assignedTo: "Vikas",
      nextFollowTime: def.nextFollowTime,
      notes: client.notes ?? "",
      noteLog: [],
      initials: initialsOf(def.client),
      callHistory: historyEntries,
      lastCall: historyEntries[0]?.date ?? "",
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
    /* storage unavailable — serve the seed for this session */
  }
  return seed;
}

function persist(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------------- Status helpers ---------------- */

export function lastContactOf(customer) {
  const dates = [customer.lastEnq, customer.lastCall, customer.callHistory[0]?.date].filter(Boolean);
  if (!dates.length) return "";
  return dates.sort().at(-1);
}

export function isDormant(customer) {
  if (customer.status === "Closed") return false;
  if (customer.nextFollow) return false;
  const since = daysSince(lastContactOf(customer));
  return since !== null && since >= DORMANT_DAYS;
}

function applyOutcomeStatus(current, outcome) {
  if (current === "Closed") return current;
  if (outcome === "Connected" && current === "New") return "Active";
  return OUTCOME_STATUS_MAP[outcome] ?? current;
}

/* ---------------- Aggregations ---------------- */

export function computeKPIs(list) {
  const today = todayISO();
  const active = list.filter((customer) => customer.status !== "Closed");
  const dueToday = active.filter((customer) => customer.nextFollow === today);
  const overdue = active.filter((customer) => customer.nextFollow && customer.nextFollow < today);
  const upcoming = active.filter(
    (customer) =>
      customer.nextFollow && customer.nextFollow > today && customer.nextFollow <= addDays(today, 7)
  );
  const dormant = active.filter(isDormant);
  const loggedToday = active.filter((customer) =>
    customer.callHistory.some((entry) => entry.date === today)
  );

  return {
    today: dueToday.length,
    overdue: overdue.length,
    upcoming: upcoming.length,
    dormant: dormant.length,
    active: active.length,
    loggedToday: loggedToday.length,
  };
}

/** Today's work queue: overdue → due today → completed today. */
export function groupToday(list) {
  const today = todayISO();
  const active = list.filter((customer) => customer.status !== "Closed");
  const completedToday = active.filter((customer) =>
    customer.callHistory.some((entry) => entry.date === today)
  );
  const completedIds = new Set(completedToday.map((customer) => customer.id));
  const dueToday = active.filter(
    (customer) => customer.nextFollow === today && !completedIds.has(customer.id)
  );
  const overdue = active.filter(
    (customer) => customer.nextFollow && customer.nextFollow < today && !completedIds.has(customer.id)
  );
  return { overdue, dueToday, completedToday };
}

export function dueSet(list) {
  const { overdue, dueToday } = groupToday(list);
  return [...overdue, ...dueToday];
}

export function groupUpcoming(list) {
  const today = todayISO();
  const horizon = addDays(today, 7);
  const upcoming = list
    .filter(
      (customer) =>
        customer.status !== "Closed" &&
        customer.nextFollow &&
        customer.nextFollow > today &&
        customer.nextFollow <= horizon
    )
    .sort((a, b) => a.nextFollow.localeCompare(b.nextFollow));

  const groups = new Map();
  upcoming.forEach((customer) => {
    if (!groups.has(customer.nextFollow)) groups.set(customer.nextFollow, []);
    groups.get(customer.nextFollow).push(customer);
  });
  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

export function dormantSet(list) {
  return list
    .filter(isDormant)
    .sort(
      (a, b) =>
        (daysSince(lastContactOf(b)) ?? 0) - (daysSince(lastContactOf(a)) ?? 0)
    );
}

export function activeSet(list) {
  const today = todayISO();
  const rank = (customer) => {
    if (customer.status === "Closed") return 4;
    if (customer.nextFollow && customer.nextFollow < today) return 0;
    if (customer.nextFollow === today) return 1;
    if (customer.nextFollow) return 2;
    return isDormant(customer) ? 3 : 3.5;
  };
  return list
    .filter((customer) => customer.status !== "Closed")
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function closedSet(list) {
  return list.filter((customer) => customer.status === "Closed");
}

/* ---------------- Search & filters ---------------- */

export function matchesQuery(customer, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  return (
    customer.name.toLowerCase().includes(q) ||
    (customer.contact ?? "").toLowerCase().includes(q) ||
    (customer.dept ?? "").toLowerCase().includes(q) ||
    (customer.phone ?? "").toLowerCase().includes(q) ||
    (customer.email ?? "").toLowerCase().includes(q) ||
    (customer.status ?? "").toLowerCase().includes(q) ||
    (customer.notes ?? "").toLowerCase().includes(q) ||
    (customer.noteLog ?? []).some((note) => note.text.toLowerCase().includes(q)) ||
    (customer.callHistory ?? []).some((entry) => entry.notes.toLowerCase().includes(q))
  );
}

function matchesFollowWindow(customer, filter, customDate) {
  if (!filter || filter === "All Follow-ups") return true;
  const today = todayISO();
  const value = customer.nextFollow;
  switch (filter) {
    case "Today":
      return value === today;
    case "Overdue":
      return Boolean(value && value < today);
    case "Tomorrow":
      return value === addDays(today, 1);
    case "This Week":
      return Boolean(value && value >= today && value <= addDays(today, 7));
    case "Next Week":
      return Boolean(value && value > addDays(today, 7) && value <= addDays(today, 14));
    case "Custom":
      return customDate ? value === customDate : true;
    default:
      return true;
  }
}

export function applyFilters(list, filters) {
  return list.filter((customer) => {
    if (filters.status && filters.status !== "All Statuses" && customer.status !== filters.status)
      return false;
    if (filters.priority && filters.priority !== "All Priorities" && customer.priority !== filters.priority)
      return false;
    if (filters.assigned && filters.assigned !== "Everyone" && customer.assignedTo !== filters.assigned)
      return false;
    if (filters.company && filters.company !== "All Companies" && customer.name !== filters.company)
      return false;
    if (!matchesFollowWindow(customer, filters.follow, filters.followCustom)) return false;
    if (!matchesQuery(customer, filters.search)) return false;
    return true;
  });
}

/* ---------------- Charts ---------------- */

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calls per day for the last 7 days (ending today). */
export function activityLast7Days(list) {
  const counts = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = addDays(todayISO(), offset);
    const day = WEEKDAY_SHORT[new Date(`${date}T00:00:00`).getDay()];
    const count = list.reduce(
      (sum, customer) =>
        sum + customer.callHistory.filter((entry) => entry.date === date).length,
      0
    );
    counts.push({ day, date, count });
  }
  return counts;
}

/** Outcome distribution across logged calls (excluding lifecycle events). */
export function outcomeDistribution(list) {
  const counts = new Map();
  list.forEach((customer) => {
    customer.callHistory.forEach((entry) => {
      if (["created", "legacy", "reschedule", "close"].includes(entry.type)) return;
      counts.set(entry.outcome, (counts.get(entry.outcome) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

/* ---------------- CRUD ---------------- */

export async function listCustomers() {
  await delay();
  try {
    return { ok: true, items: load() };
  } catch {
    return { ok: false, error: "Unable to load calls." };
  }
}

function nextHistoryId() {
  return `H-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function updateCustomer(list, id, updater) {
  let updated = null;
  const next = list.map((customer) => {
    if (customer.id !== id) return customer;
    updated = updater(customer);
    return updated;
  });
  return { next, updated };
}

/**
 * Log a call: appends to history, updates follow-up, status and counters.
 * @returns {{ok: true, record: object, scheduledFor: string}|{ok: false, error: string}}
 */
export async function logCall(id, input) {
  await delay(350);
  try {
    if (!input.date) return { ok: false, error: "Call date is required." };
    if (!CALL_OUTCOMES.includes(input.outcome)) {
      return { ok: false, error: "Select a call outcome." };
    }

    let scheduledFor = "";
    if (input.followChoice === "Tomorrow") scheduledFor = addDays(todayISO(), 1);
    else if (input.followChoice === "In 3 Days") scheduledFor = addDays(todayISO(), 3);
    else if (input.followChoice === "Next Week") scheduledFor = addDays(todayISO(), 7);
    else if (input.followChoice === "Custom Date") {
      if (!input.followDate) return { ok: false, error: "Select a follow-up date." };
      scheduledFor = input.followDate;
    }

    const list = load();
    const { next, updated } = updateCustomer(list, id, (customer) => {
      const entry = {
        id: nextHistoryId(),
        date: input.date,
        time: input.time || currentTimeHHMM(),
        outcome: input.outcome,
        notes: input.notes?.trim() ?? "",
        nextFollow: scheduledFor,
        type: "call",
      };
      const status = applyOutcomeStatus(customer.status, input.outcome);
      const closedReason =
        status === "Closed" && customer.status !== "Closed"
          ? input.outcome
          : customer.closedReason;
      return {
        ...customer,
        status,
        closedReason,
        lastCall: input.date,
        lastEnq: customer.lastEnq && customer.lastEnq >= input.date ? customer.lastEnq : input.date,
        nextFollow: scheduledFor,
        nextFollowTime: scheduledFor ? input.followTime || "10:00" : "",
        callHistory: [entry, ...customer.callHistory],
      };
    });

    if (!updated) return { ok: false, error: "Customer not found." };
    persist(next);
    return { ok: true, record: updated, scheduledFor };
  } catch {
    return { ok: false, error: "Unable to save call. Please try again." };
  }
}

/** Reschedule the next follow-up and record the reason in history. */
export async function rescheduleFollowUp(id, input) {
  await delay(300);
  try {
    if (!input.date) return { ok: false, error: "New date is required." };

    const list = load();
    const { next, updated } = updateCustomer(list, id, (customer) => ({
      ...customer,
      nextFollow: input.date,
      nextFollowTime: input.time || "10:00",
      callHistory: [
        {
          id: nextHistoryId(),
          date: todayISO(),
          time: currentTimeHHMM(),
          outcome: "Follow-up Rescheduled",
          notes: input.reason?.trim() || `Moved to ${formatDisplay(input.date)}`,
          nextFollow: input.date,
          type: "reschedule",
        },
        ...customer.callHistory,
      ],
    }));

    if (!updated) return { ok: false, error: "Customer not found." };
    persist(next);
    return { ok: true, record: updated };
  } catch {
    return { ok: false, error: "Unable to schedule follow-up. Please try again." };
  }
}

/** Close a lead — status changes, history is preserved. */
export async function closeLead(id, reason) {
  await delay(300);
  try {
    if (!CLOSE_REASONS.includes(reason)) {
      return { ok: false, error: "Select a close reason." };
    }
    const list = load();
    const { next, updated } = updateCustomer(list, id, (customer) => ({
      ...customer,
      status: CLOSE_REASON_STATUS[reason] ?? "Closed",
      closedReason: reason,
      nextFollow: "",
      nextFollowTime: "",
      callHistory: [
        {
          id: nextHistoryId(),
          date: todayISO(),
          time: currentTimeHHMM(),
          outcome: "Lead Closed",
          notes: `Reason: ${reason}`,
          nextFollow: "",
          type: "close",
        },
        ...customer.callHistory,
      ],
    }));

    if (!updated) return { ok: false, error: "Customer not found." };
    persist(next);
    return { ok: true, record: updated };
  } catch {
    return { ok: false, error: "Unable to update status. Please try again." };
  }
}

/** Append a dated note to the customer's notes log. */
export async function addNote(id, text) {
  await delay(200);
  try {
    const trimmed = text?.trim();
    if (!trimmed) return { ok: false, error: "Write a note first." };
    const list = load();
    const { next, updated } = updateCustomer(list, id, (customer) => ({
      ...customer,
      noteLog: [{ id: `N-${Date.now()}`, date: todayISO(), text: trimmed }, ...(customer.noteLog ?? [])],
    }));
    if (!updated) return { ok: false, error: "Customer not found." };
    persist(next);
    return { ok: true, record: updated };
  } catch {
    return { ok: false, error: "Unable to save note. Please try again." };
  }
}
