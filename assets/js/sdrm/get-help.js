// Get Help Now: filter resources by need, location and a search word.
// Resources come from the Flask API (GET /api/sdrm/resources); if it can't be reached,
// the saved copy in resources.json is used instead so GitHub Pages still works.
import { apiFetch, loadJSON, el, showLoadError } from "./common.js";

const root = document.querySelector("[data-sdrm-get-help]");

if (root) {
  init(root);
}

async function init(rootEl) {
  const needSelect = rootEl.querySelector("#help-need");
  const locationSelect = rootEl.querySelector("#help-location");
  const searchInput = rootEl.querySelector("#help-q");
  const form = rootEl.querySelector("#help-filters");
  const results = rootEl.querySelector("#help-results");
  const summary = rootEl.querySelector("#help-summary");
  const empty = rootEl.querySelector("#help-empty");
  const resetButtons = rootEl.querySelectorAll("[data-help-reset]");

  let data;
  try {
    data = await loadResources(rootEl.dataset.src, rootEl.querySelector("#help-source"));
  } catch (error) {
    showLoadError(results, error);
    summary.textContent = "";
    return;
  }

  const needLabels = Object.fromEntries(data.needs.map((n) => [n.id, n.label]));
  const locationLabels = Object.fromEntries(data.locations.map((l) => [l.id, l.label]));

  data.needs.forEach((n) => needSelect.append(el("option", { text: n.label, attrs: { value: n.id } })));
  data.locations.forEach((l) => locationSelect.append(el("option", { text: l.label, attrs: { value: l.id } })));

  // Allow deep links like ?need=meals&location=downtown (ignored if not a known value).
  const params = new URLSearchParams(window.location.search);
  if (needLabels[params.get("need")]) needSelect.value = params.get("need");
  if (locationLabels[params.get("location")]) locationSelect.value = params.get("location");
  searchInput.value = params.get("q") || "";

  function render() {
    const need = needSelect.value;
    const location = locationSelect.value;
    const q = searchInput.value.trim().toLowerCase();
    const matches = data.resources.filter(
      (r) =>
        (need === "all" || r.needs.includes(need)) &&
        (location === "all" || r.location === location) &&
        (!q || matchesSearch(r, q, needLabels))
    );

    results.replaceChildren(...matches.map((r) => card(r, needLabels, locationLabels)));
    results.hidden = matches.length === 0;
    empty.hidden = matches.length !== 0;

    const needText = need === "all" ? "any need" : needLabels[need].toLowerCase();
    const locationText = location === "all" ? "any location" : locationLabels[location];
    const searchText = q ? ` matching “${searchInput.value.trim()}”` : "";
    summary.textContent = `Showing ${matches.length} of ${data.resources.length} resources for ${needText} in ${locationText}${searchText}.`;

    const url = new URL(window.location.href);
    url.searchParams.set("need", need);
    url.searchParams.set("location", location);
    if (need === "all") url.searchParams.delete("need");
    if (location === "all") url.searchParams.delete("location");
    if (q) url.searchParams.set("q", searchInput.value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  form.addEventListener("change", render);
  searchInput.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  resetButtons.forEach((button) =>
    button.addEventListener("click", () => {
      needSelect.value = "all";
      locationSelect.value = "all";
      searchInput.value = "";
      render();
      needSelect.focus();
    })
  );

  render();
}

/** The live list from the backend, or the saved resources.json (and show the note) if it's unreachable. */
async function loadResources(fallbackUrl, sourceNote) {
  try {
    const response = await apiFetch("/api/sdrm/resources");
    if (response.ok) return await response.json();
  } catch {
    // Server down or blocked: fall through to the saved list
  }
  sourceNote.hidden = false;
  return loadJSON(fallbackUrl);
}

/** Same match as the backend's ?q=: name, description, or one of the resource's needs. */
function matchesSearch(resource, q, needLabels) {
  return (
    resource.name.toLowerCase().includes(q) ||
    resource.description.toLowerCase().includes(q) ||
    resource.needs.some((n) => n === q || (needLabels[n] || "").toLowerCase().includes(q))
  );
}

function card(resource, needLabels, locationLabels) {
  const pills = el(
    "p",
    { className: "sdrm__pills" },
    resource.needs.map((n) => el("span", { className: "sdrm__pill", text: needLabels[n] }))
  );
  const detail = (label, value) => el("p", { className: "sdrm__card-detail" }, [el("strong", { text: `${label}: ` }), value]);

  return el("article", { className: "sdrm__card sdrm__card--topline" }, [
    el("h3", { className: "sdrm__card-title", text: resource.name }),
    pills,
    el("p", { className: "sdrm__text", text: resource.description }),
    detail("Area", locationLabels[resource.location]),
    detail("Address", resource.address),
    detail("Hours", resource.hours),
    detail("Phone", resource.phone),
  ]);
}
