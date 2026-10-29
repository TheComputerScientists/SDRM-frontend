// My hours on /sdrm/profile/ (markup in sdrm/profile.html, issue #3): total approved and
// pending service hours, a table of my logs, and a form to log hours on a shift I signed
// up for. Everything goes through /api/sdrm/hours; a coordinator approves or rejects the
// hours on /sdrm/coordinator/. If the server can't be reached the section stays hidden and
// the page's "server can't be reached" alert shows instead.
import { getCurrentUser } from "./auth.js";
import { apiFetch, el, NetworkError } from "./common.js";

// Same limits the server checks (HOURS_MIN / HOURS_MAX / HOURS_STEP in model/sdrm.py)
const HOURS_MIN = 0.25;
const HOURS_MAX = 12;

// Status pill colors, the same ones the volunteer page uses for spots left
const STATUS_PILL = { approved: "sdrm__pill--success", pending: "sdrm__pill--alert", rejected: "sdrm__pill--full" };
const STATUS_LABEL = { approved: "Approved", pending: "Pending", rejected: "Rejected" };

const section = document.querySelector("[data-sdrm-hours]");

if (section) {
  start(section);
}

async function start(section) {
  const serverAlert = document.querySelector("[data-sdrm-server-alert]");
  const form = section.querySelector("#hours-form");
  const submit = form.querySelector('[type="submit"]');
  const shiftSelect = form.elements.opportunity;
  const formError = section.querySelector("#hours-form-error");
  const success = section.querySelector("#hours-success");
  const noShifts = section.querySelector("[data-hours-no-shifts]");
  const rows = section.querySelector("#hours-rows");
  const listError = section.querySelector("#hours-list-error");
  const totals = Object.fromEntries([...section.querySelectorAll("[data-hours-total]")].map((n) => [n.dataset.hoursTotal, n]));

  // profile.js shows the "Log in" panel or the server alert when there's no user
  if (!(await getCurrentUser())) return;

  /* ---------- load ---------- */

  async function load() {
    listError.textContent = "";
    let data;
    try {
      const response = await apiFetch("/api/sdrm/hours/mine");
      if (!response.ok) throw new Error(await errorMessage(response));
      data = await response.json();
    } catch (error) {
      if (error instanceof NetworkError) {
        // Never a blank or half-filled section: hide it and show the page's server alert
        section.hidden = true;
        if (serverAlert) serverAlert.hidden = false;
        return false;
      }
      listError.textContent = `We couldn't load your hours. ${error.message}`;
      return true;
    }
    render(data);
    return true;
  }

  function render(data) {
    totals.approved.textContent = hoursText(data.totals.approved);
    totals.pending.textContent = hoursText(data.totals.pending);

    const chosen = shiftSelect.value;
    shiftSelect.replaceChildren(
      shiftSelect.options[0],
      ...data.shifts.map((shift) => el("option", { text: `${shift.title} (${shift.day})`, attrs: { value: shift.id } }))
    );
    if (data.shifts.some((shift) => shift.id === chosen)) shiftSelect.value = chosen;
    noShifts.hidden = data.shifts.length > 0;
    form.hidden = data.shifts.length === 0;

    if (data.logs.length === 0) {
      rows.replaceChildren(el("tr", {}, [el("td", { text: "No hours logged yet.", attrs: { colspan: "4" } })]));
      return;
    }
    rows.replaceChildren(
      ...data.logs.map((log) => {
        const actions = [];
        if (log.status === "pending") {
          const remove = el("button", { className: "sdrm__button sdrm__button--red", text: "Delete", attrs: { type: "button" } });
          remove.addEventListener("click", () => removeLog(log, remove));
          actions.push(remove);
        }
        return el("tr", {}, [
          el("td", { text: `${log.shift} (${log.day})` }),
          el("td", { text: hoursText(log.hours) }),
          el("td", {}, [el("span", { className: `sdrm__pill ${STATUS_PILL[log.status] || ""}`, text: STATUS_LABEL[log.status] || log.status })]),
          el("td", {}, [el("div", { className: "sdrm__actions" }, actions)]),
        ]);
      })
    );
  }

  /* ---------- log hours ---------- */

  function clearMessages() {
    formError.textContent = "";
    success.textContent = "";
    listError.textContent = "";
  }

  /** Disable the form while a save runs: no double submits, visible loading state. */
  function setBusy(busy) {
    if (!submit.dataset.label) submit.dataset.label = submit.textContent;
    form.toggleAttribute("aria-busy", busy);
    submit.classList.toggle("sdrm__button--loading", busy);
    if (busy) {
      submit.setAttribute("aria-disabled", "true");
      submit.textContent = submit.dataset.busyLabel;
    } else {
      submit.removeAttribute("aria-disabled");
      submit.textContent = submit.dataset.label;
    }
  }

  /** Same rules the server checks, so most mistakes are caught before sending. */
  function check(entry) {
    if (!entry.opportunity) return "Choose the shift you volunteered on";
    if (!Number.isFinite(entry.hours) || entry.hours < HOURS_MIN || entry.hours > HOURS_MAX) {
      return `Hours must be a number from ${HOURS_MIN} to ${HOURS_MAX}`;
    }
    if (!Number.isInteger(entry.hours * 4)) return "Hours must be in quarter-hour steps (for example 1.25 or 2.5)";
    return "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.getAttribute("aria-disabled") === "true") return;
    clearMessages();

    const entry = {
      opportunity: shiftSelect.value,
      hours: form.elements.hours.value.trim() === "" ? NaN : Number(form.elements.hours.value),
      note: form.elements.note.value.trim(),
    };
    const problem = check(entry);
    if (problem) {
      formError.textContent = problem;
      return;
    }

    setBusy(true);
    try {
      const response = await apiFetch("/api/sdrm/hours", { method: "POST", body: entry });
      if (!response.ok) {
        formError.textContent = await errorMessage(response);
        return;
      }
      const saved = await response.json();
      form.reset();
      success.textContent = `Logged ${hoursText(saved.hours)} for ${saved.shift}. A coordinator will review it.`;
      await load();
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  /** First click asks, second click deletes (no browser confirm dialog). */
  async function removeLog(log, button) {
    clearMessages();
    if (button.dataset.confirming !== "true") {
      button.dataset.confirming = "true";
      button.textContent = "Confirm delete";
      return;
    }
    button.setAttribute("aria-disabled", "true");
    try {
      const response = await apiFetch(`/api/sdrm/hours/${encodeURIComponent(log.id)}`, { method: "DELETE" });
      if (!response.ok) {
        listError.textContent = await errorMessage(response);
        return;
      }
      success.textContent = `Deleted ${hoursText(log.hours)} for ${log.shift}.`;
      await load();
    } catch (error) {
      listError.textContent = error.message;
    } finally {
      button.removeAttribute("aria-disabled");
    }
  }

  section.hidden = false;
  await load();
}

function hoursText(hours) {
  const value = Math.round(Number(hours || 0) * 100) / 100;
  return `${value} ${value === 1 ? "hour" : "hours"}`;
}

/** The server's message for a failed request, worded for people. */
async function errorMessage(response) {
  if (response.status === 401) return "Your session ended. Log in again to log hours.";
  try {
    const body = await response.json();
    if (body && body.message) return body.message;
  } catch {
    // Not JSON
  }
  return "Something went wrong on the server. Please try again in a minute.";
}
