// Coordinator page /sdrm/coordinator/ (markup in sdrm/coordinator.html).
// Access is decided by the backend: GET /api/coordinator/ping answers 200 for
// coordinators and admins, 401 when logged out and 403 for volunteers. The header
// link is hidden for volunteers too, but typing the URL lands here and gets the
// friendly "Coordinators only" panel instead of the tools.
import { getCurrentUser, pingCoordinator } from "./auth.js";
import { startResources } from "./coordinator-resources.js";
import { startHoursReview } from "./coordinator-hours.js";
import { startShifts } from "./coordinator-shifts.js";

const panels = document.querySelectorAll("[data-sdrm-coordinator-state]");

function showState(state) {
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.sdrmCoordinatorState !== state;
  });
}

async function start() {
  try {
    await pingCoordinator();
    const user = await getCurrentUser();
    document.querySelector("[data-sdrm-coordinator-name]").textContent = user ? String(user.name || user.uid) : "coordinator";
    showState("allowed");
    startResources(document.querySelector("[data-sdrm-resources]"));
    startHoursReview(document.querySelector("[data-sdrm-hours-review]"));
    startShifts(document.querySelector("[data-sdrm-shifts]"));
  } catch (error) {
    if (error.kind === "forbidden" || error.kind === "session") {
      showState(error.kind);
      return;
    }
    document.querySelector("[data-sdrm-coordinator-error]").textContent = error.kind === "network"
      ? "We couldn't reach the server. Start it with python main.py in the SDRM-backend folder, then reload this page."
      : error.message;
    showState("error");
  }
}

start();
