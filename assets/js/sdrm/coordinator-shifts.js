// Manage shifts on /sdrm/coordinator/ (markup in sdrm/coordinator.html, issue #3).
// Coordinators and admins add, edit and delete the volunteer shifts shown on Volunteer.
// Everything goes through /api/sdrm/opportunities, which checks the role again (401 / 403).
import { apiFetch, el } from "./common.js";

/** Load the shifts and wire up the form inside the "Manage shifts" section. */
export async function startShifts(section) {
  if (!section) return;

  const form = section.querySelector("#shift-form");
  const title = section.querySelector("[data-shift-form-title]");
  const submit = section.querySelector("[data-shift-submit]");
  const cancel = section.querySelector("[data-shift-cancel]");
  const formError = section.querySelector("#shift-form-error");
  const success = section.querySelector("#shift-success");
  const daySelect = section.querySelector("#shift-day");
  const interestSelect = section.querySelector("#shift-interest");
  const rows = section.querySelector("#shift-rows");
  const listError = section.querySelector("#shift-list-error");

  let data = { days: [], interests: [], opportunities: [] };
  let editingId = null;

  /* ---------- load ---------- */

  async function load() {
    listError.textContent = "";
    try {
      const response = await apiFetch("/api/sdrm/opportunities");
      if (!response.ok) throw new Error(await errorMessage(response));
      data = await response.json();
    } catch (error) {
      listError.textContent = `We couldn't load the shifts. ${error.message}`;
      return false;
    }
    renderRows();
    return true;
  }

  function renderRows() {
    if (data.opportunities.length === 0) {
      rows.replaceChildren(el("tr", {}, [el("td", { text: "No shifts yet.", attrs: { colspan: "4" } })]));
      return;
    }
    rows.replaceChildren(
      ...data.opportunities.map((shift) => {
        const edit = el("button", { className: "sdrm__button sdrm__button--outline", text: "Edit", attrs: { type: "button" } });
        const remove = el("button", { className: "sdrm__button sdrm__button--red", text: "Delete", attrs: { type: "button" } });
        edit.addEventListener("click", () => startEdit(shift));
        remove.addEventListener("click", () => removeShift(shift, remove));
        return el("tr", {}, [
          el("td", { text: shift.title }),
          el("td", { text: shift.day }),
          el("td", { text: `${shift.spots} of ${shift.capacity}` }),
          el("td", {}, [el("div", { className: "sdrm__actions" }, [edit, remove])]),
        ]);
      })
    );
  }

  /* ---------- form ---------- */

  function fillChoices() {
    data.days.forEach((day) => daySelect.append(el("option", { text: day, attrs: { value: day } })));
    data.interests.forEach((i) => interestSelect.append(el("option", { text: i.label, attrs: { value: i.id } })));
  }

  function setMode(shift) {
    editingId = shift ? shift.id : null;
    title.textContent = shift ? `Edit “${shift.title}”` : "Add a shift";
    submit.textContent = shift ? "Save changes" : "Add shift";
    submit.dataset.label = submit.textContent;
    cancel.hidden = !shift;
  }

  function startEdit(shift) {
    clearMessages();
    form.reset();
    form.elements.title.value = shift.title;
    form.elements.day.value = shift.day;
    form.elements.interest.value = shift.interest;
    form.elements.time.value = shift.time;
    form.elements.capacity.value = String(shift.capacity);
    form.elements.description.value = shift.description;
    setMode(shift);
    form.elements.title.focus();
  }

  function stopEdit() {
    form.reset();
    setMode(null);
  }

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

  function readForm() {
    const value = (name) => form.elements[name].value.trim();
    return {
      title: value("title"),
      day: value("day"),
      interest: value("interest"),
      time: value("time"),
      capacity: value("capacity") === "" ? NaN : Number(value("capacity")),
      description: value("description"),
    };
  }

  /** Same required fields the server checks, so most mistakes are caught before sending. */
  function check(shift) {
    if (!shift.title) return "Title is required";
    if (!shift.day) return "Choose a day";
    if (!shift.interest) return "Choose a kind of work";
    if (!Number.isInteger(shift.capacity) || shift.capacity < 0 || shift.capacity > 500) {
      return "Capacity must be a whole number from 0 to 500";
    }
    if (!shift.description) return "Description is required";
    return "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.getAttribute("aria-disabled") === "true") return;
    clearMessages();

    const shift = readForm();
    const problem = check(shift);
    if (problem) {
      formError.textContent = problem;
      return;
    }

    const wasEditing = editingId;
    setBusy(true);
    try {
      const response = await apiFetch(wasEditing ? `/api/sdrm/opportunities/${encodeURIComponent(wasEditing)}` : "/api/sdrm/opportunities", {
        method: wasEditing ? "PUT" : "POST",
        body: shift,
      });
      if (!response.ok) {
        formError.textContent = await errorMessage(response);
        return;
      }
      const saved = await response.json();
      setBusy(false);
      stopEdit();
      success.textContent = wasEditing ? `Saved “${saved.title}”.` : `Added “${saved.title}”. It now shows on Volunteer.`;
      await load();
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      setBusy(false);
    }
  });

  cancel.addEventListener("click", () => {
    clearMessages();
    stopEdit();
  });

  /** First click asks, second click deletes (no browser confirm dialog). */
  async function removeShift(shift, button) {
    clearMessages();
    if (button.dataset.confirming !== "true") {
      button.dataset.confirming = "true";
      button.textContent = "Confirm delete";
      return;
    }
    button.setAttribute("aria-disabled", "true");
    try {
      const response = await apiFetch(`/api/sdrm/opportunities/${encodeURIComponent(shift.id)}`, { method: "DELETE" });
      if (!response.ok) {
        listError.textContent = await errorMessage(response);
        return;
      }
      if (editingId === shift.id) stopEdit();
      success.textContent = `Deleted “${shift.title}”.`;
      await load();
    } catch (error) {
      listError.textContent = error.message;
    } finally {
      button.removeAttribute("aria-disabled");
    }
  }

  if (await load()) fillChoices();
  setMode(null);
}

/** The server's message for a failed request, worded for people. */
async function errorMessage(response) {
  if (response.status === 401) return "Your session ended. Log in again with a coordinator account.";
  if (response.status === 403) return "Only coordinators and admins can change shifts.";
  try {
    const body = await response.json();
    if (body && body.message) return body.message;
  } catch {
    // Not JSON
  }
  return "Something went wrong on the server. Please try again in a minute.";
}
