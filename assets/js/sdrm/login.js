// Log in and Create account forms on /sdrm/login/ (markup in sdrm/login.html).
// Talks to the Flask backend through auth.js; passwords are never stored or logged.
import { baseurl } from "../api/config.js";
import { login, signup, isServerReachable } from "./auth.js";

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const serverAlert = document.querySelector("[data-sdrm-server-alert]");
const signupSuccess = document.getElementById("signup-success");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UID_PATTERN = /^[A-Za-z0-9._-]{2,40}$/; // same rule as the backend

/* ---------- small helpers ---------- */

const errorFor = (input) => document.getElementById(`${input.id}-error`);

function setFieldError(input, message) {
  errorFor(input).textContent = message;
  input.setAttribute("aria-invalid", "true");
}

function clearFieldError(input) {
  const error = errorFor(input);
  if (error) error.textContent = "";
  input.removeAttribute("aria-invalid");
}

function clearErrors(form) {
  form.querySelectorAll(".sdrm__input").forEach(clearFieldError);
  form.querySelector(".sdrm__auth-form-error").textContent = "";
}

function setFormError(form, message) {
  form.querySelector(".sdrm__auth-form-error").textContent = message;
}

function showServerAlert(show) {
  serverAlert.hidden = !show;
}

/** Disable a form while its request runs: no double submits, visible loading state. */
function setBusy(form, busy) {
  const button = form.querySelector('[type="submit"]');
  if (!button.dataset.label) button.dataset.label = button.textContent;
  form.toggleAttribute("aria-busy", busy);
  button.classList.toggle("sdrm__button--loading", busy);
  if (busy) {
    button.setAttribute("aria-disabled", "true");
    button.textContent = button.dataset.busyLabel;
  } else {
    button.removeAttribute("aria-disabled");
    button.textContent = button.dataset.label;
  }
}

const isBusy = (form) => form.hasAttribute("aria-busy");

/** Show the first problem: focus its field so the linked error is read out. */
function focusFirstInvalid(form) {
  const first = form.querySelector('[aria-invalid="true"]');
  if (first) first.focus();
}

/** Route an AuthError to the right field, the server banner, or the form message. */
function showAuthError(form, error) {
  if (error.kind === "network") {
    showServerAlert(true);
    setFormError(form, "We couldn't reach the login server. See the message at the top of the page.");
    return;
  }
  showServerAlert(false);
  const input = error.field && form.elements[error.field];
  if (input) {
    setFieldError(input, error.message);
    input.focus();
  } else {
    setFormError(form, error.message || "Something went wrong. Please try again.");
  }
}

/* ---------- show / hide password ---------- */

document.querySelectorAll("[data-sdrm-reveal]").forEach((button) => {
  const input = document.getElementById(button.getAttribute("aria-controls"));
  const label = button.firstChild; // the visible "Show" / "Hide" text node
  button.hidden = false;
  button.addEventListener("click", () => {
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    label.textContent = reveal ? "Hide" : "Show";
    input.focus();
  });
});

/** Put revealed passwords back to dots (after submit or reset). */
function hidePasswords(form) {
  form.querySelectorAll("[data-sdrm-reveal]").forEach((button) => {
    document.getElementById(button.getAttribute("aria-controls")).type = "password";
    button.firstChild.textContent = "Show";
  });
}

// Clear a field's error as soon as the person edits it.
[loginForm, signupForm].forEach((form) => {
  form.addEventListener("input", (event) => {
    if (event.target.matches(".sdrm__input")) clearFieldError(event.target);
  });
});

/* ---------- Log in ---------- */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isBusy(loginForm)) return;
  clearErrors(loginForm);

  const { uid, password } = loginForm.elements;
  const uidValue = uid.value.trim();

  if (!uidValue) setFieldError(uid, "Enter your User ID.");
  if (!password.value) setFieldError(password, "Enter your password.");
  if (!uidValue || !password.value) {
    focusFirstInvalid(loginForm);
    return;
  }

  setBusy(loginForm, true);
  try {
    await login(uidValue, password.value);
    showServerAlert(false);
    password.value = "";
    hidePasswords(loginForm);
    window.location.assign(`${baseurl}/`);
  } catch (error) {
    showAuthError(loginForm, error);
    setBusy(loginForm, false);
  }
});

/* ---------- Create account ---------- */

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isBusy(signupForm)) return;
  clearErrors(signupForm);
  signupSuccess.textContent = "";

  const { name, uid, email, password, confirm } = signupForm.elements;
  const values = {
    name: name.value.trim(),
    uid: uid.value.trim(),
    email: email.value.trim(),
    password: password.value,
  };

  if (values.name.length < 2) setFieldError(name, "Enter your name (at least 2 characters).");
  if (values.uid.length < 2) {
    setFieldError(uid, "Enter a User ID (at least 2 characters).");
  } else if (!UID_PATTERN.test(values.uid)) {
    setFieldError(uid, "Use only letters, numbers, dots, dashes and underscores (2 to 40 characters).");
  }
  if (!EMAIL_PATTERN.test(values.email)) setFieldError(email, "Enter an email address like name@example.com.");
  if (values.password.length < 8) setFieldError(password, "Use at least 8 characters for your password.");
  if (!confirm.value) {
    setFieldError(confirm, "Type your password again.");
  } else if (confirm.value !== values.password) {
    setFieldError(confirm, "The passwords don't match. Type the same password in both boxes.");
  }
  if (signupForm.querySelector('[aria-invalid="true"]')) {
    focusFirstInvalid(signupForm);
    return;
  }

  setBusy(signupForm, true);
  try {
    const user = await signup(values);
    showServerAlert(false);
    signupForm.reset();
    hidePasswords(signupForm);
    signupSuccess.textContent = "Account created, you can log in now.";
    clearErrors(loginForm);
    loginForm.elements.uid.value = user.uid;
    loginForm.elements.password.focus();
  } catch (error) {
    showAuthError(signupForm, error);
  } finally {
    setBusy(signupForm, false);
  }
});

/* ---------- warn early if the server is down ---------- */

isServerReachable().then((reachable) => showServerAlert(!reachable));
