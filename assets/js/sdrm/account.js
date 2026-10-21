// Account-aware links on every SDRM page (top menu, hub tiles):
//   #loginArea                     top-menu link: "Log in", or the user's name -> their profile
//   [data-sdrm-show="signed-out"]  shown while logged out ("Log in")
//   [data-sdrm-show="signed-in"]   shown once logged in ("My profile")
//   [data-sdrm-role="coordinator"] shown only to that role and admins (hidden in the HTML)
// Also wires the profile page's Log out button ([data-sdrm-logout]). If the Flask server
// is down the logged-out markup simply stays as it is.
import { getCurrentUser, hasRole, logout } from "./auth.js";

function show(user) {
  document.querySelectorAll("[data-sdrm-show]").forEach((node) => {
    node.hidden = (node.dataset.sdrmShow === "signed-in") !== Boolean(user);
  });
  document.querySelectorAll("[data-sdrm-role]").forEach((node) => {
    node.hidden = !hasRole(user, node.dataset.sdrmRole, "admin");
  });

  const loginArea = document.getElementById("loginArea");
  if (loginArea && user) {
    const name = String(user.name || user.uid || "My profile");
    loginArea.href = loginArea.dataset.profileHref;
    loginArea.title = `My profile (logged in as ${name})`;
    loginArea.textContent = name;
    const label = document.createElement("span");
    label.className = "sdrm__visually-hidden";
    label.textContent = "My profile: ";
    loginArea.prepend(label);
  }
}

const logoutButton = document.querySelector("[data-sdrm-logout]");
const logoutStatus = document.querySelector("[data-sdrm-logout-status]");

if (logoutButton) {
  let busy = false;
  logoutButton.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    logoutButton.setAttribute("aria-disabled", "true");
    logoutButton.textContent = "Logging out…";
    try {
      await logout();
      // Reload so the page and every account-aware link start from the logged-out state.
      window.location.reload();
    } catch (error) {
      if (logoutStatus) logoutStatus.textContent = error.message || "We couldn't log you out. Please try again.";
      busy = false;
      logoutButton.removeAttribute("aria-disabled");
      logoutButton.textContent = "Log out";
    }
  });
}

getCurrentUser().then(show);
