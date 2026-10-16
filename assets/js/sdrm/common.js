// Shared helpers for the SDRM student project pages (vanilla ES modules, no build step).
// The pages keep no data of their own: everything comes from the Flask backend.
import { pythonURI, fetchOptions } from "../api/config.js";

const TIMEOUT_MS = 8000;

/** Thrown when the Flask server can't be reached (down, CORS refused, or timed out). */
export class NetworkError extends Error {
  constructor() {
    super("We couldn't reach the server.");
    this.name = "NetworkError";
  }
}

/**
 * fetch() against the Flask API with cookies, JSON headers and a timeout.
 * Resolves with the Response whatever its status; rejects with a NetworkError.
 */
export async function apiFetch(path, { method = "GET", body } = {}) {
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
    // The original error is not passed on.
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
}

/** GET a backend endpoint (e.g. "/api/sdrm/stats") and parse its JSON; throws a readable error on failure. */
export async function loadData(path) {
  const response = await apiFetch(path);
  if (!response.ok) {
    throw new Error(`The server answered with an error (HTTP ${response.status}).`);
  }
  return response.json();
}

/**
 * Create an element. `props` may contain `className`, `text`, `attrs` (object),
 * and `hidden`. Children may be nodes or strings. Never uses innerHTML.
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  if (props.hidden) node.hidden = true;
  Object.entries(props.attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
  children.forEach((child) => {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  });
  return node;
}

/** Build a labeled sdrm__toggle (checkbox switch). */
export function toggle({ id, name, value, label }) {
  const input = el("input", {
    className: "sdrm__toggle-input",
    attrs: { type: "checkbox", id, name, value },
  });
  const wrapper = el("label", { className: "sdrm__toggle", attrs: { for: id } }, [
    input,
    el("span", { className: "sdrm__toggle-track", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "sdrm__toggle-label", text: label }),
  ]);
  return { wrapper, input };
}

/** Show a load error inside a container as a field error. */
export function showLoadError(container, error) {
  const text = error instanceof NetworkError
    ? "Sorry, this page's data could not be loaded: we couldn't reach our Flask server. Start it with python main.py in the SDRM-backend folder, then refresh."
    : `Sorry, this page's data could not be loaded. Please refresh and try again. (${error.message})`;
  container.replaceChildren(el("p", { className: "sdrm__field-error", attrs: { role: "alert" }, text }));
}
