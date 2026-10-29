// Review hours on /sdrm/coordinator/ (markup in sdrm/coordinator.html, issue #3).
// Coordinators and admins approve or reject the service hours volunteers logged on their
// profile. Everything goes through /api/sdrm/hours, which checks the role again (401 / 403).
import { apiFetch, el } from "./common.js";

/** Load the pending hours and wire up Approve / Reject inside the "Review hours" section. */
export async function startHoursReview(section) {
  if (!section) return;

  const rows = section.querySelector("#hours-review-rows");
  const success = section.querySelector("#hours-review-success");
  const listError = section.querySelector("#hours-review-error");

  async function load() {
    listError.textContent = "";
    let logs;
    try {
      const response = await apiFetch("/api/sdrm/hours?status=pending");
      if (!response.ok) throw new Error(await errorMessage(response));
      logs = (await response.json()).logs;
    } catch (error) {
      rows.replaceChildren(el("tr", {}, [el("td", { text: "Hours couldn't be loaded.", attrs: { colspan: "5" } })]));
      listError.textContent = `We couldn't load the hours to review. ${error.message}`;
      return;
    }

    if (logs.length === 0) {
      rows.replaceChildren(el("tr", {}, [el("td", { text: "Nothing to review right now.", attrs: { colspan: "5" } })]));
      return;
    }
    rows.replaceChildren(
      ...logs.map((log) => {
        const approve = el("button", { className: "sdrm__button sdrm__button--blue", text: "Approve", attrs: { type: "button" } });
        const reject = el("button", { className: "sdrm__button sdrm__button--red", text: "Reject", attrs: { type: "button" } });
        approve.addEventListener("click", () => review(log, "approved", [approve, reject]));
        reject.addEventListener("click", () => review(log, "rejected", [approve, reject]));
        return el("tr", {}, [
          el("td", { text: log.volunteer || log.uid || "Unknown" }),
          el("td", { text: `${log.shift} (${log.day})` }),
          el("td", { text: String(log.hours) }),
          el("td", { text: log.note || "—" }),
          el("td", {}, [el("div", { className: "sdrm__actions" }, [approve, reject])]),
        ]);
      })
    );
  }

  async function review(log, status, buttons) {
    if (buttons.some((b) => b.getAttribute("aria-disabled") === "true")) return;
    success.textContent = "";
    listError.textContent = "";
    buttons.forEach((b) => b.setAttribute("aria-disabled", "true"));
    try {
      const response = await apiFetch(`/api/sdrm/hours/${encodeURIComponent(log.id)}`, { method: "PUT", body: { status } });
      if (!response.ok) {
        listError.textContent = await errorMessage(response);
        return;
      }
      success.textContent = `${status === "approved" ? "Approved" : "Rejected"} ${log.hours} hours for ${log.volunteer || log.uid} on ${log.shift}.`;
      await load();
    } catch (error) {
      listError.textContent = error.message;
    } finally {
      buttons.forEach((b) => b.removeAttribute("aria-disabled"));
    }
  }

  await load();
}

/** The server's message for a failed request, worded for people. */
async function errorMessage(response) {
  if (response.status === 401) return "Your session ended. Log in again with a coordinator account.";
  try {
    const body = await response.json();
    if (body && body.message) return body.message;
  } catch {
    // Not JSON
  }
  if (response.status === 403) return "Only coordinators and admins can review hours.";
  return "Something went wrong on the server. Please try again in a minute.";
}
