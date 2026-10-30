// Hub survey pop-up (index.md). Opens once for visitors with no saved answers who have not
// dismissed it; answers go through survey-store.js so the persona page shows the same choices.
import { readPersona, savePersona } from "./survey-store.js";

const DISMISSED_KEY = "sdrm-survey-dismissed";
const CLOSE_DELAY = 1500;

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch (error) {
    // Without storage the dismissal can't be remembered, so don't open it on every visit.
    console.warn("Unable to read the SDRM survey dismissal.", error);
    return true;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "true");
  } catch (error) {
    console.warn("Unable to save the SDRM survey dismissal.", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.querySelector("[data-sdrm-survey-popup]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const form = dialog.querySelector("[data-sdrm-survey-form]");
  const options = [...dialog.querySelectorAll("[data-sdrm-persona-option]")];
  const status = dialog.querySelector("[data-sdrm-survey-status]");
  const save = dialog.querySelector("[data-sdrm-survey-save]");
  const later = dialog.querySelector("[data-sdrm-survey-later]");
  if (!form || !options.length || !status || !save || !later) return;

  const questions = [...new Set(options.map((option) => option.dataset.question))];
  const saved = readPersona();
  if (questions.some((question) => saved[question]) || wasDismissed()) return;

  let returnFocus = null;

  function dismiss() {
    markDismissed();
    dialog.close();
  }

  dialog.addEventListener("close", () => {
    const target = returnFocus && returnFocus.isConnected && returnFocus !== document.body
      ? returnFocus
      : document.getElementById("main");
    if (target) target.focus({ preventScroll: true });
  });

  // Esc
  dialog.addEventListener("cancel", markDismissed);

  // Clicks on the backdrop land on the <dialog> itself, outside its box.
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right
      && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dismiss();
  });

  later.addEventListener("click", dismiss);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = Object.fromEntries(
      options.filter((option) => option.checked).map((option) => [option.dataset.question, option.value])
    );
    if (!Object.keys(answers).length) {
      dismiss();
      return;
    }
    savePersona(answers);
    save.disabled = true;
    status.textContent = "Thanks, your answers were saved.";
    setTimeout(() => dialog.close(), CLOSE_DELAY);
  });

  returnFocus = document.activeElement;
  dialog.showModal();
  options[0].focus();
});
