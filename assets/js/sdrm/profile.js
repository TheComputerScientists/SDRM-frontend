// Profile page /sdrm/profile/ (markup in sdrm/profile.html): shows the signed-in
// user's name, email, User ID and role (read-only), and edits their guardian info.
// Everything comes from /api/id; nothing is stored in the browser.
import { getCurrentUser, isServerReachable, updateGuardian, checkGuardian, getRole, roleLabel } from "./auth.js";

const loading = document.querySelector("[data-sdrm-profile-loading]");
const signedOut = document.querySelector("[data-sdrm-profile-signed-out]");
const profile = document.querySelector("[data-sdrm-profile]");
const serverAlert = document.querySelector("[data-sdrm-server-alert]");
const form = document.getElementById("guardian-form");
const success = document.getElementById("guardian-success");
const formError = document.getElementById("guardian-form-error");
const removeButton = form.querySelector("[data-sdrm-guardian-remove]");
const { guardianName, guardianEmail } = form.elements;

const field = (name) => document.querySelector(`[data-sdrm-profile-${name}]`);

/* ---------- small helpers ---------- */

const errorFor = (input) => document.getElementById(`${input.id}-error`);

function setFieldError(input, message) {
  errorFor(input).textContent = message;
  input.setAttribute("aria-invalid", "true");
}

function clearFieldError(input) {
  errorFor(input).textContent = "";
  input.removeAttribute("aria-invalid");
}

function clearMessages() {
  [guardianName, guardianEmail].forEach(clearFieldError);
  formError.textContent = "";
  success.textContent = "";
}

/** Disable the form while a save runs: no double submits, visible loading state. */
function setBusy(busy, button) {
  if (!button.dataset.label) button.dataset.label = button.textContent;
  form.toggleAttribute("aria-busy", busy);
  button.classList.toggle("sdrm__button--loading", busy);
  if (busy) {
    button.setAttribute("aria-disabled", "true");
    if (button.dataset.busyLabel) button.textContent = button.dataset.busyLabel;
  } else {
    button.removeAttribute("aria-disabled");
    button.textContent = button.dataset.label;
  }
}

/* ---------- show the profile ---------- */

function render(user) {
  field("name").textContent = user.name || "";
  // Older template accounts have "?" instead of an email
  field("email").textContent = user.email && user.email !== "?" ? user.email : "Not set";
  field("uid").textContent = user.uid;
  const role = field("role");
  role.textContent = roleLabel(user);
  role.classList.toggle("sdrm__pill--success", getRole(user) !== "volunteer");

  guardianName.value = user.guardian_name || "";
  guardianEmail.value = user.guardian_email || "";
  removeButton.hidden = !(user.guardian_name || user.guardian_email);
}

async function start() {
  const user = await getCurrentUser();
  loading.hidden = true;
  if (user) {
    render(user);
    profile.hidden = false;
    return;
  }
  serverAlert.hidden = await isServerReachable();
  signedOut.hidden = false;
}

/* ---------- save / remove guardian info ---------- */

async function save(values, button, message) {
  setBusy(true, button);
  try {
    render(await updateGuardian(values));
    success.textContent = message;
    if (button.hidden) guardianName.focus(); // "Remove" just hid itself
  } catch (error) {
    const input = error.field && form.elements[error.field];
    if (input) {
      setFieldError(input, error.message);
      input.focus();
    } else {
      serverAlert.hidden = error.kind !== "network";
      formError.textContent = error.kind === "network"
        ? "We couldn't reach the server. See the message at the top of the page."
        : error.message;
    }
  } finally {
    setBusy(false, button);
  }
}

form.addEventListener("input", (event) => {
  if (event.target.matches(".sdrm__input")) clearFieldError(event.target);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (form.hasAttribute("aria-busy")) return;
  clearMessages();

  const values = { guardianName: guardianName.value.trim(), guardianEmail: guardianEmail.value.trim() };
  if (!values.guardianName && !values.guardianEmail) {
    save(values, event.submitter || form.querySelector('[type="submit"]'), "Guardian info removed.");
    return;
  }

  const errors = checkGuardian(values);
  if (errors.guardianName) setFieldError(guardianName, errors.guardianName);
  if (errors.guardianEmail) setFieldError(guardianEmail, errors.guardianEmail);
  const firstInvalid = form.querySelector('[aria-invalid="true"]');
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  save(values, event.submitter || form.querySelector('[type="submit"]'), "Guardian info saved.");
});

removeButton.addEventListener("click", () => {
  if (form.hasAttribute("aria-busy")) return;
  clearMessages();
  save({ guardianName: "", guardianEmail: "" }, removeButton, "Guardian info removed.");
});

start();
