/* User accounts, per-module access rights and the local session.
   Record shape:
   { id, name, email, role, rights: { po: "edit"|"read", quotations: "edit"|"read" }, createdAt }

   `role` only controls user management (Administrators may create/delete
   users and change rights); day-to-day editing is governed by `rights`,
   so a Sales Executive can be allowed to edit quotations but only view
   purchase orders.

   Records live in localStorage until a backend is connected — swap the
   async functions for API calls then. The session is local-only: no
   passwords are stored. */

const USERS_KEY = "vbiochem.users";
const SESSION_KEY = "vbiochem.session";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const USER_ROLES = ["Administrator", "Sales Executive", "Viewer"];

/** Modules whose access can be granted as edit vs read-only. */
export const MODULES = [
  { key: "po", label: "Purchase Orders" },
  { key: "quotations", label: "Quotations" },
];

export const ACCESS_LEVELS = ["edit", "read"];

/* ---------------- Seed ---------------- */

function buildSeed() {
  return [
    {
      id: "u-vikas",
      name: "Vikas R",
      email: "vikas@vbiochem.example",
      role: "Administrator",
      rights: { po: "edit", quotations: "edit" },
      createdAt: "2025-11-04",
    },
    {
      id: "u-priya",
      name: "Priya Sharma",
      email: "priya.sharma@vbiochem.example",
      role: "Sales Executive",
      rights: { po: "edit", quotations: "edit" },
      createdAt: "2026-01-12",
    },
    {
      id: "u-rahul",
      name: "Rahul Verma",
      email: "rahul.verma@vbiochem.example",
      role: "Sales Executive",
      rights: { po: "read", quotations: "edit" },
      createdAt: "2026-03-08",
    },
    {
      id: "u-meera",
      name: "Meera Nair",
      email: "meera.nair@vbiochem.example",
      role: "Sales Executive",
      rights: { po: "read", quotations: "read" },
      createdAt: "2026-05-21",
    },
    {
      id: "u-arjun",
      name: "Arjun Patel",
      email: "arjun.patel@vbiochem.example",
      role: "Viewer",
      rights: { po: "read", quotations: "read" },
      createdAt: "2026-07-02",
    },
  ];
}

/* ---------------- Persistence ---------------- */

function load() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  const seed = buildSeed();
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(seed));
  } catch {
    /* storage unavailable — still serve the seed for this session */
  }
  return seed;
}

function persist(list) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function uid() {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sanitizeRights(rights) {
  return {
    po: rights?.po === "edit" ? "edit" : "read",
    quotations: rights?.quotations === "edit" ? "edit" : "read",
  };
}

/** Today's date (YYYY-MM-DD) for createdAt. */
function todayISO(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ---------------- Display shape ---------------- */

/**
 * Map a stored record to the shape AppContext / Topbar already consume:
 * `name` is the first word (matches the previous static currentUser),
 * `fullName` is the full display name, `initials` are derived.
 */
export function toDisplayUser(user) {
  if (!user?.name) return null;
  const words = String(user.name).trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return {
    id: user.id,
    name: words[0],
    fullName: user.name,
    initials,
    role: user.role ?? "Viewer",
    rights: sanitizeRights(user.rights),
  };
}

/** True when the (display) user may change records in a module. */
export function hasRight(user, moduleKey) {
  return user?.rights?.[moduleKey] === "edit";
}

/* ---------------- Session ---------------- */

function findSessionUser(users) {
  let id = null;
  try {
    id = window.localStorage.getItem(SESSION_KEY);
  } catch {
    /* no stored session */
  }
  return (
    users.find((user) => user.id === id) ??
    users.find((user) => user.role === "Administrator") ??
    users[0] ??
    null
  );
}

/**
 * Synchronous session read for AppContext's initial state (avoids a flash
 * of the wrong user). Never persists in a non-browser environment.
 */
export function getSessionSync() {
  let users;
  if (typeof window === "undefined") {
    users = buildSeed();
  } else {
    users = load();
  }
  return toDisplayUser(findSessionUser(users));
}

/** Switch the local session to another user (no passwords — demo only). */
export async function setSession(userId) {
  await delay(160);
  try {
    const users = load();
    const user = users.find((entry) => entry.id === userId);
    if (!user) return { ok: false, error: "User not found." };
    window.localStorage.setItem(SESSION_KEY, user.id);
    return { ok: true, user: toDisplayUser(user) };
  } catch {
    return { ok: false, error: "Unable to switch account." };
  }
}

/* ---------------- Validation ---------------- */

export function validateUser(input, existing = [], excludeId = null) {
  const errors = {};
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();

  if (!name) errors.name = "Name is required.";
  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (
    existing.some(
      (entry) =>
        entry.id !== excludeId &&
        String(entry.email ?? "").toLowerCase() === email.toLowerCase()
    )
  ) {
    errors.email = "A user with this email already exists.";
  }

  if (!USER_ROLES.includes(input.role)) errors.role = "Select a role.";

  errors.valid = Object.keys(errors).length === 0;
  return errors;
}

/* ---------------- CRUD ---------------- */

export async function listUsers() {
  await delay(300);
  try {
    return { ok: true, items: load() };
  } catch {
    return { ok: false, error: "Unable to load users." };
  }
}

export async function createUser(input) {
  await delay(320);
  try {
    const users = load();
    const errors = validateUser(input, users);
    if (!errors.valid) {
      return { ok: false, error: "Fix the highlighted fields.", fieldErrors: errors };
    }

    const record = {
      id: uid(),
      name: String(input.name).trim(),
      email: String(input.email).trim(),
      role: input.role,
      rights: sanitizeRights(input.rights),
      createdAt: todayISO(),
    };
    persist([...users, record]);
    return { ok: true, record };
  } catch {
    return { ok: false, error: "Unable to create the user." };
  }
}

export async function updateUser(id, patch) {
  await delay(260);
  try {
    const users = load();
    const index = users.findIndex((entry) => entry.id === id);
    if (index < 0) return { ok: false, error: "User not found." };

    const current = users[index];
    const merged = { ...current };

    if ("name" in patch) merged.name = String(patch.name).trim();
    if ("email" in patch) merged.email = String(patch.email).trim();
    if ("rights" in patch) merged.rights = sanitizeRights(patch.rights);

    if ("role" in patch && patch.role !== current.role) {
      if (!USER_ROLES.includes(patch.role)) {
        return { ok: false, error: "Select a valid role." };
      }
      const admins = users.filter((entry) => entry.role === "Administrator");
      if (current.role === "Administrator" && admins.length <= 1) {
        return {
          ok: false,
          error: "At least one administrator must remain.",
        };
      }
      merged.role = patch.role;
    }

    const errors = validateUser(merged, users, id);
    if (!errors.valid) {
      return {
        ok: false,
        error: errors.email ?? errors.name ?? "Fix the highlighted fields.",
        fieldErrors: errors,
      };
    }

    users[index] = merged;
    persist(users);
    return { ok: true, record: merged };
  } catch {
    return { ok: false, error: "Unable to update the user." };
  }
}

export async function deleteUser(id) {
  await delay(300);
  try {
    const users = load();
    const target = users.find((entry) => entry.id === id);
    if (!target) return { ok: false, error: "User not found." };

    const session = findSessionUser(users);
    if (session && session.id === id) {
      return { ok: false, error: "You cannot delete your own account." };
    }
    if (
      target.role === "Administrator" &&
      users.filter((entry) => entry.role === "Administrator").length <= 1
    ) {
      return { ok: false, error: "At least one administrator must remain." };
    }

    persist(users.filter((entry) => entry.id !== id));
    return { ok: true, record: target };
  } catch {
    return { ok: false, error: "Unable to delete the user." };
  }
}
