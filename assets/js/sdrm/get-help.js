// Get Help Now: filter resources.json by need and location.
import { loadJSON, el, showLoadError } from "./common.js";

const root = document.querySelector("[data-sdrm-get-help]");

if (root) {
  init(root);
}

async function init(rootEl) {
  const needSelect = rootEl.querySelector("#help-need");
  const locationSelect = rootEl.querySelector("#help-location");
  const form = rootEl.querySelector("#help-filters");
  const results = rootEl.querySelector("#help-results");
  const summary = rootEl.querySelector("#help-summary");
  const empty = rootEl.querySelector("#help-empty");
  const resetButtons = rootEl.querySelectorAll("[data-help-reset]");

  let data;
  try {
    data = await loadJSON(rootEl.dataset.src);
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

  function render() {
    const need = needSelect.value;
    const location = locationSelect.value;
    const matches = data.resources.filter(
      (r) => (need === "all" || r.needs.includes(need)) && (location === "all" || r.location === location)
    );

    results.replaceChildren(...matches.map((r) => card(r, needLabels, locationLabels)));
    results.hidden = matches.length === 0;
    empty.hidden = matches.length !== 0;

    const needText = need === "all" ? "any need" : needLabels[need].toLowerCase();
    const locationText = location === "all" ? "any location" : locationLabels[location];
    summary.textContent = `Showing ${matches.length} of ${data.resources.length} resources for ${needText} in ${locationText}.`;

    const url = new URL(window.location.href);
    url.searchParams.set("need", need);
    url.searchParams.set("location", location);
    if (need === "all") url.searchParams.delete("need");
    if (location === "all") url.searchParams.delete("location");
    window.history.replaceState(null, "", url);
  }

  form.addEventListener("change", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  resetButtons.forEach((button) =>
    button.addEventListener("click", () => {
      needSelect.value = "all";
      locationSelect.value = "all";
      render();
      needSelect.focus();
    })
  );

  render();
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
