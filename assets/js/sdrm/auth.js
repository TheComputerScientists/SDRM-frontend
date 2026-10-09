// Account helpers for the SDRM pages, talking to the Python (Flask) backend only.
// API calls follow navigation/authentication/login.md; the Java calls are left out.
//
// Rules: passwords are only sent in request bodies. They are never stored, logged,
// or shown, and raw server errors are never displayed. Callers get an AuthError
// with a `kind` and a friendly `message` instead.
import { pythonURI, fetchOptions } from "../api/config.js";

const TIMEOUT_MS = 8000;

/** Error with a kind the page can react to (field to mark, banner to show). */
export class AuthError extends Error {
  /**
   * @param {"network"|"credentials"|"taken"|"validation"|"session"|"server"} kind
   * @param {string} message friendly text, safe to show
   * @param {string} [field] which form field it belongs to (name, email, password)
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

/** Returns the signed-in user ({ uid, name, ... }) or null. Never throws. */
export async function getCurrentUser() {
  try {
    const response = await request("/api/id");
    if (!response.ok) return null;
    const user = await response.json();
    return user && typeof user.uid === "string" ? user : null;
  } catch {
    return null;
  }
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

  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("session", "You were logged in, but your browser didn't keep the session. Allow cookies for this site and try again.");
  }
  return user;
}

/**
 * Create an account from a name, email and password. The backend makes up the
 * internal User ID itself. Resolves with the new user's public data; rejects
 * with an AuthError.
 */
export async function signup({ name, email, password }) {
  const response = await request("/api/user", { method: "POST", body: { name, email, password } });

  if (response.ok) {
    const user = await response.json().catch(() => null);
    if (!user || typeof user.uid !== "string") {
      throw new AuthError("server", "Something went wrong on the server. Please try again in a minute.");
    }
    return { uid: user.uid, name: user.name };
  }

  const message = (await serverMessage(response)).toLowerCase();
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
}
