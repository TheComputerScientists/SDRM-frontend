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
   * @param {"network"|"credentials"|"taken"|"github"|"validation"|"session"|"server"} kind
   * @param {string} message friendly text, safe to show
   * @param {string} [field] which form field it belongs to (name, uid, email, password)
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
 * Log in with a User ID and password, then confirm the session cookie with /api/id.
 * Resolves with the user; rejects with an AuthError.
 */
export async function login(uid, password) {
  const response = await request("/api/authenticate", { method: "POST", body: { uid, password } });

  if (response.status === 401) {
    throw new AuthError("credentials", "That User ID and password don't match. Check both and try again.", "password");
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
 * Create an account. Resolves with the new user's public data; rejects with an AuthError.
 * The backend also requires the User ID to be a real GitHub username.
 */
export async function signup({ name, uid, email, password }) {
  const response = await request("/api/user", { method: "POST", body: { name, uid, email, password } });

  if (response.ok) {
    const user = await response.json().catch(() => null);
    // For a duplicate User ID this backend answers 200 with the *existing* account,
    // so a different name or email means the ID was already taken.
    if (!user || user.uid !== uid || user.name !== name || (user.email || "") !== email) {
      throw new AuthError("taken", "That User ID is already taken. Try logging in, or pick a different one.", "uid");
    }
    return { uid: user.uid, name: user.name };
  }

  const message = (await serverMessage(response)).toLowerCase();
  if (response.status === 404 && message.includes("github")) {
    throw new AuthError("github", "We couldn't find that GitHub username. Your User ID must be your GitHub username.", "uid");
  }
  if (message.includes("duplicate")) {
    throw new AuthError("taken", "That User ID is already taken. Try logging in, or pick a different one.", "uid");
  }
  if (message.includes("password")) {
    throw new AuthError("validation", "Use at least 8 characters for your password.", "password");
  }
  if (message.startsWith("name")) {
    throw new AuthError("validation", "Enter a name with at least 2 characters.", "name");
  }
  if (message.startsWith("user id")) {
    throw new AuthError("validation", "Enter a User ID with at least 2 characters.", "uid");
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
