// Volunteer: filter the shifts from GET /api/sdrm/opportunities by day and interest.
// Signing up takes spots on the server (POST/DELETE .../<id>/signup), one per person in
// the group (Group size, 1-10), so it needs an account; logged-out visitors get a
// "Log in to sign up" link instead of the button.
// When the server can't be reached (e.g. on GitHub Pages) the shifts come from
// opportunities.json instead, with every Sign up button disabled.
import { apiFetch, loadJSON, el, toggle, showLoadError, NetworkError } from "./common.js";

const root = document.querySelector("[data-sdrm-volunteer]");

// Same limits the server checks (GROUP_SIZE_MIN / GROUP_SIZE_MAX in model/sdrm.py)
const GROUP_MIN = 1;
const GROUP_MAX = 10;

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
  const offlineNote = rootEl.querySelector("#vol-offline");
  const loginUrl = rootEl.dataset.loginUrl;

  let data;
  let offline = false;
  try {
    data = await loadLive();
  } catch {
    // No server: show the static shift list so the page still works, but sign-ups can't happen
    offline = true;
    try {
      data = await loadJSON(rootEl.dataset.src);
    } catch (error) {
      showLoadError(results, error);
      summary.textContent = "";
      return;
    }
    data.loggedIn = false;
    offlineNote.hidden = false;
  }

  const interestLabels = Object.fromEntries(data.interests.map((i) => [i.id, i.label]));
  let loggedIn = data.loggedIn;

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

  /** Take (or resize) or give back spots on the server; updates the card from the server's answer. */
  async function change(opp, method) {
    const card = cards.get(opp.id);
    if (card.busy) return;
    const groupSize = Number(card.group.value);
    card.groupError.textContent = "";
    if (method === "POST" && !(Number.isInteger(groupSize) && groupSize >= GROUP_MIN && groupSize <= GROUP_MAX)) {
      card.groupError.textContent = `Group size must be a whole number from ${GROUP_MIN} to ${GROUP_MAX}.`;
      card.group.focus();
      return;
    }
    card.busy = true;
    card.signUp.setAttribute("aria-disabled", "true");
    card.cancel.setAttribute("aria-disabled", "true");
    try {
      const response = await apiFetch(`/api/sdrm/opportunities/${encodeURIComponent(opp.id)}/signup`, {
        method,
        body: method === "POST" ? { groupSize } : undefined,
      });
      if (response.status === 401) {
        loggedIn = false;
        data.opportunities.forEach((o) => (o.signedUp = false));
        data.opportunities.forEach(update);
        announce.textContent = "Your session ended. Log in to sign up for shifts.";
        return;
      }
      if (response.status === 400) {
        // Not enough spots left for this group (or a bad size): the server says why
        const body = await response.json().catch(() => ({}));
        if (!opp.signedUp && typeof body.spots === "number") opp.spots = body.spots;
        update(opp);
        card.groupError.textContent = body.message || "That group size didn't work. Please try a smaller group.";
        card.group.focus();
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      Object.assign(opp, await response.json());
      update(opp);
      if (opp.signedUp) {
        announce.textContent = `You're signed up for ${opp.title} on ${opp.day}${groupText(opp.groupSize)}. ${spotsText(opp.spots)}.`;
        card.cancel.focus();
      } else {
        announce.textContent = `Sign-up for ${opp.title} cancelled. ${spotsText(opp.spots)}.`;
        card.signUp.focus();
      }
    } catch (error) {
      announce.textContent = error instanceof NetworkError
        ? "We couldn't reach the server, so nothing changed. Please try again."
        : "Something went wrong on the server, so nothing changed. Please try again in a minute.";
    } finally {
      card.busy = false;
      card.signUp.removeAttribute("aria-disabled");
      card.cancel.removeAttribute("aria-disabled");
    }
  }

  // Build every card once; filtering only toggles `hidden` so focus is never lost.
  const cards = new Map();
  data.opportunities.forEach((opp) => {
    const pill = el("span", { className: "sdrm__pill" });
    const signUp = el("button", {
      className: "sdrm__button sdrm__button--blue",
      attrs: {
        type: "button",
        "aria-describedby": `vol-${opp.id}-title vol-${opp.id}-spots${offline ? " vol-offline" : ""}`,
      },
    });
    const cancel = el("button", {
      className: "sdrm__button sdrm__button--outline",
      text: "Cancel sign-up",
      attrs: { type: "button", "aria-describedby": `vol-${opp.id}-title` },
    });
    const login = el("a", {
      className: "sdrm__button sdrm__button--blue",
      text: "Log in to sign up",
      attrs: { href: loginUrl, "aria-describedby": `vol-${opp.id}-title vol-${opp.id}-spots` },
    });
    pill.id = `vol-${opp.id}-spots`;
    const groupId = `vol-${opp.id}-group`;
    const group = el("input", {
      className: "sdrm__input",
      attrs: {
        type: "number",
        id: groupId,
        name: "groupSize",
        min: String(GROUP_MIN),
        max: String(GROUP_MAX),
        step: "1",
        inputmode: "numeric",
        value: String(opp.groupSize || GROUP_MIN),
        "aria-describedby": `vol-${opp.id}-spots ${groupId}-error`,
      },
    });
    const groupError = el("p", { className: "sdrm__field-error", attrs: { id: `${groupId}-error`, role: "alert" } });

    const article = el("article", { className: "sdrm__card sdrm__card--topline" }, [
      el("h3", { className: "sdrm__card-title", text: opp.title, attrs: { id: `vol-${opp.id}-title` } }),
      el("p", { className: "sdrm__pills" }, [
        el("span", { className: "sdrm__pill", text: opp.day }),
        el("span", { className: "sdrm__pill", text: interestLabels[opp.interest] }),
        pill,
      ]),
      el("p", { className: "sdrm__text", text: opp.description }),
      el("p", { className: "sdrm__card-detail" }, [el("strong", { text: "Time: " }), opp.time]),
      el("div", { className: "sdrm__field" }, [
        el("label", { className: "sdrm__field-label", text: "Group size", attrs: { for: groupId } }),
        group,
        groupError,
      ]),
      el("p", { className: "sdrm__actions" }, [signUp, login, cancel]),
    ]);

    signUp.addEventListener("click", () => {
      if (opp.signedUp ? resizing(opp) : opp.spots > 0) change(opp, "POST");
    });
    group.addEventListener("input", () => {
      groupError.textContent = "";
      update(opp);
    });
    cancel.addEventListener("click", () => {
      if (opp.signedUp) change(opp, "DELETE");
    });

    cards.set(opp.id, { article, pill, signUp, cancel, login, group, groupError, busy: false });
    results.append(article);
    update(opp);
  });

  /** True when the user is signed up and has typed a different group size. */
  function resizing(opp) {
    return opp.signedUp && Number(cards.get(opp.id).group.value) !== opp.groupSize;
  }

  function update(opp) {
    const { pill, signUp, cancel, login, group } = cards.get(opp.id);
    const left = opp.spots;

    pill.textContent = spotsText(left);
    pill.className = "sdrm__pill " + (left === 0 ? "sdrm__pill--full" : left <= 2 ? "sdrm__pill--alert" : "sdrm__pill--success");

    if (offline) {
      login.hidden = true;
      cancel.hidden = true;
      signUp.hidden = false;
      signUp.disabled = true;
      signUp.textContent = left === 0 ? "Full" : "Sign up";
      group.disabled = true;
      return;
    }

    // Logged out: a login link while there's room, otherwise the disabled "Full" button
    login.hidden = loggedIn || left === 0;
    signUp.hidden = !login.hidden;
    group.disabled = !loggedIn || (!opp.signedUp && left === 0);
    if (opp.signedUp && document.activeElement !== group && !cards.get(opp.id).busy) {
      group.value = String(opp.groupSize);
    }
    // Signed up with a new number typed in: the same button saves the new group size
    signUp.disabled = opp.signedUp ? !resizing(opp) : left === 0;
    signUp.textContent = resizing(opp) ? "Update group size" : opp.signedUp ? "Signed up" : left === 0 ? "Full" : "Sign up";
    cancel.hidden = !opp.signedUp;
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

  filter();
}

function groupText(size) {
  return size > 1 ? ` for a group of ${size}` : "";
}

function spotsText(left) {
  if (left === 0) return "Full";
  return `${left} ${left === 1 ? "spot" : "spots"} left`;
}

/** Shifts with live spot counts from the server; throws if it's down or answers with an error. */
async function loadLive() {
  const response = await apiFetch("/api/sdrm/opportunities");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
