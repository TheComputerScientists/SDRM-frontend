// Manage resources on /sdrm/coordinator/ (markup in sdrm/coordinator.html, issue #5).
// Coordinators and admins add, edit and delete the help resources shown on Get Help Now.
// Everything goes through /api/sdrm/resources, which checks the role again (401 / 403).
import { apiFetch, el, toggle } from "./common.js";

/** Load the lists and wire up the form inside the "Manage resources" section. */
export async function startResources(section) {
  if (!section) return;

  const form = section.querySelector("#resource-form");
  const title = section.querySelector("[data-resource-form-title]");
  const submit = section.querySelector("[data-resource-submit]");
  const cancel = section.querySelector("[data-resource-cancel]");
  const formError = section.querySelector("#resource-form-error");
  const success = section.querySelector("#resource-success");
  const needsBox = section.querySelector("#resource-needs");
  const locationSelect = section.querySelector("#resource-location");
  const rows = section.querySelector("#resource-rows");
  const listError = section.querySelector("#resource-list-error");

  let data = { needs: [], locations: [], resources: [] };
  let editingId = null;

  /* ---------- load ---------- */

  async function load() {
    listError.textContent = "";
    try {
      const response = await apiFetch("/api/sdrm/resources");
      if (!response.ok) throw new Error(await errorMessage(response));
      data = await response.json();
    } catch (error) {
      listError.textContent = `We couldn't load the resources. ${error.message}`;
      return false;
    }
    renderRows();
    return true;
  }

  function locationLabel(id) {
    const location = data.locations.find((l) => l.id === id);
    return location ? location.label : id;
  }

  function renderRows() {
    if (data.resources.length === 0) {
      rows.replaceChildren(el("tr", {}, [el("td", { text: "No resources yet.", attrs: { colspan: "3" } })]));
      return;
    }
    rows.replaceChildren(
      ...data.resources.map((resource) => {
        const edit = el("button", { className: "sdrm__button sdrm__button--outline", text: "Edit", attrs: { type: "button" } });
        const remove = el("button", { className: "sdrm__button sdrm__button--red", text: "Delete", attrs: { type: "button" } });
        edit.addEventListener("click", () => startEdit(resource));
        remove.addEventListener("click", () => removeResource(resource, remove));
        return el("tr", {}, [
          el("td", { text: resource.name }),
          el("td", { text: locationLabel(resource.location) }),
          el("td", {}, [el("div", { className: "sdrm__actions" }, [edit, remove])]),
        ]);
      })
    );
  }

  /* ---------- form ---------- */

  function fillChoices() {
    needsBox.replaceChildren(
      ...data.needs.map((need) => toggle({ id: `resource-need-${need.id}`, name: "needs", value: need.id, label: need.label }).wrapper)
    );
    data.locations.forEach((l) => locationSelect.append(el("option", { text: l.label, attrs: { value: l.id } })));
  }

  function setMode(resource) {
    editingId = resource ? resource.id : null;
    title.textContent = resource ? `Edit “${resource.name}”` : "Add a resource";
    submit.textContent = resource ? "Save changes" : "Add resource";
    submit.dataset.label = submit.textContent;
    cancel.hidden = !resource;
  }

  function startEdit(resource) {
    clearMessages();
    form.reset();
    form.elements.name.value = resource.name;
    form.elements.location.value = resource.location;
    form.elements.description.value = resource.description;
    form.elements.address.value = resource.address;
    form.elements.hours.value = resource.hours;
    form.elements.phone.value = resource.phone;
    needsBox.querySelectorAll("input").forEach((input) => {
      input.checked = resource.needs.includes(input.value);
    });
    setMode(resource);
    form.elements.name.focus();
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
      name: value("name"),
      needs: [...needsBox.querySelectorAll("input:checked")].map((input) => input.value),
      location: value("location"),
      description: value("description"),
      address: value("address"),
      hours: value("hours"),
      phone: value("phone"),
    };
  }

  /** Same required fields the server checks, so most mistakes are caught before sending. */
  function check(resource) {
    if (!resource.name) return "Name is required";
    if (resource.needs.length === 0) return "Choose at least one need";
    if (!resource.location) return "Location is required";
    if (!resource.description) return "Description is required";
    return "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.getAttribute("aria-disabled") === "true") return;
    clearMessages();

    const resource = readForm();
    const problem = check(resource);
    if (problem) {
      formError.textContent = problem;
      return;
    }

    const wasEditing = editingId;
    setBusy(true);
    try {
      const response = await apiFetch(wasEditing ? `/api/sdrm/resources/${encodeURIComponent(wasEditing)}` : "/api/sdrm/resources", {
        method: wasEditing ? "PUT" : "POST",
        body: resource,
      });
      if (!response.ok) {
        formError.textContent = await errorMessage(response);
        return;
      }
      const saved = await response.json();
      setBusy(false);
      stopEdit();
      success.textContent = wasEditing ? `Saved “${saved.name}”.` : `Added “${saved.name}”. It now shows on Get Help Now.`;
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
  async function removeResource(resource, button) {
    clearMessages();
    if (button.dataset.confirming !== "true") {
      button.dataset.confirming = "true";
      button.textContent = "Confirm delete";
      return;
    }
    button.setAttribute("aria-disabled", "true");
    try {
      const response = await apiFetch(`/api/sdrm/resources/${encodeURIComponent(resource.id)}`, { method: "DELETE" });
      if (!response.ok) {
        listError.textContent = await errorMessage(response);
        return;
      }
      if (editingId === resource.id) stopEdit();
      success.textContent = `Deleted “${resource.name}”.`;
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
  if (response.status === 403) return "Only coordinators and admins can change resources.";
  try {
    const body = await response.json();
    if (body && body.message) return body.message;
  } catch {
    // Not JSON
  }
  return "Something went wrong on the server. Please try again in a minute.";
}
