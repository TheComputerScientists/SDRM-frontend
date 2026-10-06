// Volunteer: filter opportunities.json by day and interest; sign up decrements spots.
import { loadJSON, el, toggle, showLoadError, storage } from "./common.js";

const STORAGE_KEY = "sdrm-volunteer-signups";
const root = document.querySelector("[data-sdrm-volunteer]");

if (root) {
  init(root);
}

async function init(rootEl) {
  const dayOptions = rootEl.querySelector("#vol-days");
  const interestOptions = rootEl.querySelector("#vol-interests");
  const results = rootEl.querySelector("#vol-results");
  const summary = rootEl.querySelector("#vol-summary");
  const announce = rootEl.querySelector("#vol-announce");
  const empty = rootEl.querySelector("#vol-empty");
  const clearButton = rootEl.querySelector("#vol-clear");
  const resetButton = rootEl.querySelector("#vol-reset");

  let data;
  try {
    data = await loadJSON(rootEl.dataset.src);
  } catch (error) {
    showLoadError(results, error);
    return;
  }

  const interestLabels = Object.fromEntries(data.interests.map((i) => [i.id, i.label]));
  // signups: { [opportunityId]: true } for this browser only (no personal data is stored).
  let signups = storage.get(STORAGE_KEY, {});

  const dayInputs = data.days.map((day) => {
    const { wrapper, input } = toggle({ id: `vol-day-${day.toLowerCase()}`, name: "day", value: day, label: day });
    dayOptions.append(wrapper);
    return input;
  });
  const interestInputs = data.interests.map((interest) => {
    const { wrapper, input } = toggle({
      id: `vol-interest-${interest.id}`,
      name: "interest",
      value: interest.id,
      label: interest.label,
    });
    interestOptions.append(wrapper);
    return input;
  });

  const remaining = (opp) => Math.max(0, opp.spots - (signups[opp.id] ? 1 : 0));

  // Build every card once; filtering only toggles `hidden` so focus is never lost.
  const cards = new Map();
  data.opportunities.forEach((opp) => {
    const pill = el("span", { className: "ocs__status-pill" });
    const signUp = el("button", {
      className: "ocs__btn medium alert-green fill",
      attrs: { type: "button", "aria-describedby": `vol-${opp.id}-title vol-${opp.id}-spots` },
    });
    const cancel = el("button", {
      className: "ocs__btn medium alert-yellow",
      text: "Cancel sign-up",
      attrs: { type: "button", "aria-describedby": `vol-${opp.id}-title` },
    });
    pill.id = `vol-${opp.id}-spots`;

    const article = el("article", { className: "ocs__grid-cell" }, [
      el("h3", { text: opp.title, attrs: { id: `vol-${opp.id}-title` } }),
      el("p", { className: "ocs__links" }, [
        el("span", { className: "ocs__status-pill ocs__status-pill--neutral", text: opp.day }),
        el("span", { className: "ocs__status-pill ocs__status-pill--neutral", text: interestLabels[opp.interest] }),
        pill,
      ]),
      el("p", { className: "ocs__text", text: opp.description }),
      el("p", { className: "ocs__text" }, [el("strong", { text: "Time: " }), opp.time]),
      el("p", { className: "ocs__links" }, [signUp, cancel]),
    ]);

    signUp.addEventListener("click", () => {
      if (signups[opp.id] || remaining(opp) === 0) return;
      signups = { ...signups, [opp.id]: true };
      storage.set(STORAGE_KEY, signups);
      update(opp);
      announce.textContent = `You're signed up for ${opp.title} on ${opp.day}. ${spotsText(remaining(opp))}.`;
      cancel.focus();
    });
    cancel.addEventListener("click", () => {
      const { [opp.id]: _removed, ...rest } = signups;
      signups = rest;
      storage.set(STORAGE_KEY, signups);
      update(opp);
      announce.textContent = `Sign-up for ${opp.title} cancelled. ${spotsText(remaining(opp))}.`;
      signUp.focus();
    });

    cards.set(opp.id, { article, pill, signUp, cancel });
    results.append(article);
    update(opp);
  });

  function update(opp) {
    const { pill, signUp, cancel } = cards.get(opp.id);
    const left = remaining(opp);
    const signed = Boolean(signups[opp.id]);

    pill.textContent = spotsText(left);
    pill.className = "ocs__status-pill " + (left === 0 ? "ocs__status-pill--neutral" : left <= 2 ? "ocs__status-pill--alert" : "ocs__status-pill--success");

    signUp.disabled = signed || left === 0;
    signUp.textContent = signed ? "Signed up" : left === 0 ? "Full" : "Sign up";
    cancel.hidden = !signed;
  }

  function filter() {
    const days = dayInputs.filter((i) => i.checked).map((i) => i.value);
    const interests = interestInputs.filter((i) => i.checked).map((i) => i.value);
    let shown = 0;

    data.opportunities.forEach((opp) => {
      const match =
        (days.length === 0 || days.includes(opp.day)) && (interests.length === 0 || interests.includes(opp.interest));
      cards.get(opp.id).article.hidden = !match;
      if (match) shown += 1;
    });

    results.hidden = shown === 0;
    empty.hidden = shown !== 0;
    const dayText = days.length ? days.join(", ") : "any day";
    const interestText = interests.length ? interests.map((i) => interestLabels[i]).join(", ") : "any interest";
    summary.textContent = `Showing ${shown} of ${data.opportunities.length} opportunities for ${dayText} and ${interestText}.`;
  }

  rootEl.querySelector("#vol-filters").addEventListener("change", filter);
  clearButton.addEventListener("click", () => {
    [...dayInputs, ...interestInputs].forEach((i) => (i.checked = false));
    filter();
    dayInputs[0].focus();
  });
  resetButton.addEventListener("click", () => {
    signups = {};
    storage.remove(STORAGE_KEY);
    data.opportunities.forEach(update);
    announce.textContent = "Demo reset. All spot counts are back to their starting numbers.";
  });

  filter();
}

function spotsText(left) {
  if (left === 0) return "Full";
  return `${left} ${left === 1 ? "spot" : "spots"} left`;
}
