// Header account area on every SDRM page: "Log in" when logged out,
// "Hi, <name>" (a link to the profile page) and a Log out button when logged in.
// Coordinators and admins also get the Coordinator nav link. If the Flask server
// is down the logged-out markup simply stays as it is.
import { getCurrentUser, isCoordinator, logout } from "./auth.js";

const area = document.querySelector("[data-sdrm-account]");
const coordinatorLink = document.querySelector("[data-sdrm-coordinator-link]");

if (area) {
  const loginLink = area.querySelector("[data-sdrm-account-login]");
  const greeting = area.querySelector("[data-sdrm-account-greeting]");
  const logoutButton = area.querySelector("[data-sdrm-account-logout]");
  const status = area.querySelector("[data-sdrm-account-status]");

  const show = (user) => {
    const name = user ? String(user.name || user.uid) : "";
    greeting.textContent = user ? `Hi, ${name}` : "";
    if (user) {
      const hint = document.createElement("span");
      hint.className = "sdrm__visually-hidden";
      hint.textContent = ", view your profile";
      greeting.append(hint);
    }
    greeting.title = user ? `${name}: your profile` : "";
    greeting.hidden = !user;
    if (coordinatorLink) coordinatorLink.hidden = !isCoordinator(user);
    logoutButton.hidden = !user;
    loginLink.hidden = Boolean(user);
    area.classList.toggle("sdrm__header-account--signed-in", Boolean(user));
  };

  let busy = false;
  logoutButton.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    logoutButton.setAttribute("aria-disabled", "true");
    logoutButton.textContent = "Logging out…";
    try {
      await logout();
      show(null);
      status.textContent = "You're logged out.";
      loginLink.focus();
    } catch (error) {
      status.textContent = error.message || "We couldn't log you out. Please try again.";
    } finally {
      busy = false;
      logoutButton.removeAttribute("aria-disabled");
      logoutButton.textContent = "Log out";
    }
  });

  getCurrentUser().then(show);
}
