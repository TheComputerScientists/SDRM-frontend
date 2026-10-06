// Shared helpers for the SDRM student project pages (vanilla ES modules, no build step).

/** Fetch and parse a JSON file; throws a readable error on failure. */
export async function loadJSON(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
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

/** Build a labeled ocs__toggle (checkbox switch). */
export function toggle({ id, name, value, label }) {
  const input = el("input", {
    className: "ocs__toggle-input",
    attrs: { type: "checkbox", id, name, value },
  });
  const wrapper = el("label", { className: "ocs__toggle", attrs: { for: id } }, [
    input,
    el("span", { className: "ocs__toggle-track", attrs: { "aria-hidden": "true" } }),
    el("span", { className: "ocs__toggle-label", text: label }),
  ]);
  return { wrapper, input };
}

/** Show a load error inside a container using the OCS callout. */
export function showLoadError(container, error) {
  container.replaceChildren(
    el("p", {
      className: "ocs__field-error",
      attrs: { role: "alert" },
      text: `Sorry, this page's data could not be loaded. Please refresh and try again. (${error.message})`,
    })
  );
}

/** Small safe wrapper around localStorage (private mode / blocked storage). */
export const storage = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: state lasts until reload */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
