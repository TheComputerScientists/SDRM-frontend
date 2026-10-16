// Account helpers for the SDRM pages, talking to the Python (Flask) backend only.
// API calls follow navigation/authentication/login.md; the Java calls are left out.
//
// Rules: passwords are only sent in request bodies. They are never stored, logged,
// or shown, and raw server errors are never displayed. Callers get an AuthError
// with a `kind` and a friendly `message` instead. Guardian info is only sent when
// the person typed it, and nothing is kept in localStorage or sessionStorage.
//
// Roles: every page asks isCoordinator(user) / hasRole(user, ...) from here instead
// of reading user.role itself. Hiding links is only for looks; the backend still
// answers 401/403 on coordinator routes.
import { pythonURI, fetchOptions } from "../api/config.js";

const TIMEOUT_MS = 8000;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Same limits as the backend (model/user.py). */
export const GUARDIAN_NAME_MAX = 100;
export const GUARDIAN_EMAIL_MAX = 254;

/** Error with a kind the page can react to (field to mark, banner to show). */
export class AuthError extends Error {
  /**
   * @param {"network"|"credentials"|"taken"|"validation"|"session"|"forbidden"|"server"} kind
   * @param {string} message friendly text, safe to show
   * @param {string} [field] which form field it belongs to (name, email, password, guardianName, guardianEmail)
   */
  constructor(kind, message, field) {
    super(message);
    this.name = "AuthError";
    this.kind = kind;
    this.field = field;
  }
}

/** fetch() against the Flask API with cookies, JSON headers and a timeout. */
async function request(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${pythonURI}${path}`, {
      ...fetchOptions,
      method,
      cache: "no-store",
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Server down, CORS refused, or timed out. The original error is not passed on.
    throw new AuthError("network", "We couldn't reach the login server.");
  } finally {
    clearTimeout(timer);
  }
}

/** Read the backend's `message` field (used only to classify errors, never shown). */
async function serverMessage(response) {
  try {
    const data = await response.json();
    return typeof data?.message === "string" ? data.message : "";
  } catch {
    return "";
  }
}

let currentUser = null; // one /api/id request per page load, shared by the header and the page

/**
 * Returns the signed-in user ({ uid, name, role, ... }) or null. Never throws.
 * Pass { refresh: true } to ask the server again instead of reusing this page's answer.
 */
export function getCurrentUser({ refresh = false } = {}) {
  if (!currentUser || refresh) {
    currentUser = (async () => {
      try {
        const response = await request("/api/id");
        if (!response.ok) return null;
        const user = await response.json();
        return user && typeof user.uid === "string" ? user : null;
      } catch {
        return null;
      }
    })();
  }
  return currentUser;
}

/* ---------- roles ---------- */

/** The user's role in lower case: "volunteer", "coordinator" or "admin" (null when logged out). */
export function getRole(user) {
  if (!user) return null;
  const role = String(user.role || "").toLowerCase();
  return role === "coordinator" || role === "admin" ? role : "volunteer";
}

/** True when the user has one of the roles, e.g. hasRole(user, "coordinator", "admin"). */
export function hasRole(user, ...roles) {
  const role = getRole(user);
  return role !== null && roles.map((r) => r.toLowerCase()).includes(role);
}

/** Coordinators and admins see coordinator links. */
export const isCoordinator = (user) => hasRole(user, "coordinator", "admin");

/** "coordinator" -> "Coordinator", for showing a role. */
export const roleLabel = (user) => {
  const role = getRole(user);
  return role ? role[0].toUpperCase() + role.slice(1) : "";
};

/* ---------- guardian info ---------- */

/**
 * Check guardian name and email (both required together). Returns { guardianName?, guardianEmail? }
 * with a friendly message per bad field; an empty object means both are fine.
 */
export function checkGuardian({ guardianName, guardianEmail }) {
  const errors = {};
  if (guardianName.length < 2) {
    errors.guardianName = "Enter your parent or guardian's name (at least 2 characters).";
  } else if (guardianName.length > GUARDIAN_NAME_MAX) {
    errors.guardianName = `Keep the guardian's name under ${GUARDIAN_NAME_MAX + 1} characters.`;
  }
  if (!EMAIL_PATTERN.test(guardianEmail) || guardianEmail.length > GUARDIAN_EMAIL_MAX) {
    errors.guardianEmail = "Enter your guardian's email address, like name@example.com.";
  }
  return errors;
}

/** Turn a backend "Guardian ..." message into an AuthError on the right field, or null. */
function guardianError(message) {
  if (message.startsWith("guardian name")) {
    return new AuthError("validation", "Check your guardian's name (2 to 100 characters).", "guardianName");
  }
  if (message.startsWith("guardian email")) {
    return new AuthError("validation", "Enter your guardian's email address, like name@example.com.", "guardianEmail");
  }
  return null;
}

/** True when the Flask server answers at all (any HTTP status counts). */
export async function isServerReachable() {
  try {
    await request("/api/id");
    return true;
  } catch {
    return false;
  }
}

/**
 * Log in with an email and password, then confirm the session cookie with /api/id.
 * Resolves with the user; rejects with an AuthError.
 */
export async function login(email, password) {
  const response = await request("/api/authenticate", { method: "POST", body: { email, password } });

  if (response.status === 401) {
    throw new AuthError("credentials", "That email and password don't match. Check both and try again.", "password");
  }
  if (!response.ok) {
    throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
  }

  const user = await getCurrentUser({ refresh: true });
  if (!user) {
    throw new AuthError("session", "You were logged in, but your browser didn't keep the session. Allow cookies for this site and try again.");
  }
  return user;
}

/**
 * Create an account from a name, email and password, plus guardian name and email
 * for volunteers under 18 (leave them out otherwise). The backend makes up the
 * internal User ID itself and always starts new accounts as volunteers. Resolves
 * with the new user's public data; rejects with an AuthError.
 */
export async function signup({ name, email, password, guardianName, guardianEmail }) {
  const body = { name, email, password };
  if (guardianName || guardianEmail) {
    body.guardian_name = guardianName;
    body.guardian_email = guardianEmail;
  }
  const response = await request("/api/user", { method: "POST", body });

  if (response.ok) {
    const user = await response.json().catch(() => null);
    if (!user || typeof user.uid !== "string") {
      throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
    }
    return { uid: user.uid, name: user.name };
  }

  const message = (await serverMessage(response)).toLowerCase();
  const guardian = guardianError(message);
  if (guardian) throw guardian;
  if (response.status === 409 || message.includes("already registered")) {
    throw new AuthError("taken", "An account with that email already exists. Try logging in instead.", "email");
  }
  if (message.includes("password")) {
    throw new AuthError("validation", "Use at least 8 characters for your password.", "password");
  }
  if (message.startsWith("name")) {
    throw new AuthError("validation", "Enter a name with at least 2 characters.", "name");
  }
  if (message.startsWith("email")) {
    throw new AuthError("validation", "Enter an email address like name@example.com.", "email");
  }
  if (message.startsWith("user id")) {
    // A server that hasn't been updated yet still insists on a User ID.
    throw new AuthError("server", "The login server is out of date and still asks for a User ID. Update SDRM-backend and restart it.");
  }
  throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
}

/** Log out by expiring the session cookie. Rejects with an AuthError on failure. */
export async function logout() {
  const response = await request("/api/authenticate", { method: "DELETE" });
  // 401 means the session had already ended, which is the goal anyway.
  if (!response.ok && response.status !== 401) {
    throw new AuthError("server", "We couldn't log you out. Please try again.");
  }
  currentUser = Promise.resolve(null);
}

/**
 * Save the signed-in user's guardian name and email ("" for both removes them).
 * Resolves with the updated user; rejects with an AuthError.
 */
export async function updateGuardian({ guardianName, guardianEmail }) {
  const response = await request("/api/user", {
    method: "PUT",
    body: { guardian_name: guardianName, guardian_email: guardianEmail },
  });

  if (response.ok) {
    const user = await response.json().catch(() => null);
    if (!user || typeof user.uid !== "string") {
      throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
    }
    currentUser = Promise.resolve(user);
    return user;
  }
  if (response.status === 401) {
    throw new AuthError("session", "Your session ended. Log in again to save your changes.");
  }
  const guardian = guardianError((await serverMessage(response)).toLowerCase());
  if (guardian) throw guardian;
  throw new AuthError("server", "We couldn't save your changes. Please try again in a minute.");
}

/**
 * Ask the backend whether the signed-in user may use coordinator pages.
 * Resolves when allowed; rejects with an AuthError of kind "session"
 * (401, not logged in) or "forbidden" (403, a volunteer).
 */
export async function pingCoordinator() {
  const response = await request("/api/coordinator/ping");
  if (response.ok) return;
  if (response.status === 401) {
    throw new AuthError("session", "Log in with a coordinator account to see this page.");
  }
  if (response.status === 403) {
    throw new AuthError("forbidden", "This page is for volunteer coordinators.");
  }
  throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
}
