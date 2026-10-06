// Ways to Give: convert a dollar amount into meals and nights of shelter using rates.json.
import { loadJSON, el, showLoadError } from "./common.js";

const root = document.querySelector("[data-sdrm-give]");

if (root) {
  init(root);
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const count = new Intl.NumberFormat("en-US");
const MAX_AMOUNT = 1000000;

/**
 * Validate the raw text. Returns { amount } or { error }.
 * Accepts "25", "25.50", "$1,000". Rejects negatives and non-numbers.
 */
export function parseAmount(raw) {
  const text = raw.trim().replace(/^\$/, "").replace(/,/g, "").trim();
  if (text === "") return { error: "Please enter a dollar amount, for example 25." };
  if (/^-/.test(text)) return { error: "Please enter a positive amount. Negative numbers can't be converted." };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { error: "Please use numbers only, for example 25 or 25.50." };
  }
  const amount = Number(text);
  if (!Number.isFinite(amount)) return { error: "Please use numbers only, for example 25 or 25.50." };
  if (amount > MAX_AMOUNT) return { error: `Please enter an amount up to ${money.format(MAX_AMOUNT)}.` };
  return { amount };
}

async function init(rootEl) {
  const form = rootEl.querySelector("#give-form");
  const input = rootEl.querySelector("#give-amount");
  const monthly = rootEl.querySelector("#give-monthly");
  const error = rootEl.querySelector("#give-error");
  const results = rootEl.querySelector("#give-results");
  const stats = rootEl.querySelector("#give-stats");
  const summary = rootEl.querySelector("#give-summary");
  const rateMeal = rootEl.querySelector("#rate-meal");
  const rateNight = rootEl.querySelector("#rate-night");

  let rates;
  try {
    rates = await loadJSON(rootEl.dataset.src);
  } catch (err) {
    showLoadError(results, err);
    results.hidden = false;
    return;
  }

  rateMeal.textContent = money.format(rates.costPerMeal);
  rateNight.textContent = money.format(rates.costPerNight);

  function stat(value, label) {
    return el("div", { className: "sdrm__stat" }, [
      el("span", { className: "sdrm__stat-value", text: count.format(value) }),
      el("span", { className: "sdrm__stat-label", text: label }),
    ]);
  }

  function setError(message) {
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    results.hidden = true;
  }

  function calculate({ showEmptyError }) {
    const raw = input.value;
    if (raw.trim() === "" && !showEmptyError) {
      error.textContent = "";
      input.removeAttribute("aria-invalid");
      results.hidden = true;
      return;
    }
    const parsed = parseAmount(raw);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    error.textContent = "";
    input.removeAttribute("aria-invalid");

    const amount = parsed.amount;
    const isMonthly = monthly.checked;
    const meals = Math.floor(amount / rates.costPerMeal);
    const nights = Math.floor(amount / rates.costPerNight);

    const items = [stat(meals, `Meals ${isMonthly ? "per month" : ""}`.trim()), stat(nights, `Nights of shelter ${isMonthly ? "per month" : ""}`.trim())];
    let sentence = `${isMonthly ? `Giving ${money.format(amount)} each month` : `A one-time gift of ${money.format(amount)}`} could provide about ${count.format(meals)} meals or ${count.format(nights)} nights of shelter`;

    if (isMonthly) {
      const yearly = amount * 12;
      const mealsYear = Math.floor(yearly / rates.costPerMeal);
      const nightsYear = Math.floor(yearly / rates.costPerNight);
      items.push(stat(mealsYear, "Meals per year"), stat(nightsYear, "Nights per year"));
      sentence += ` per month. Over a year (${money.format(yearly)}), that is about ${count.format(mealsYear)} meals or ${count.format(nightsYear)} nights.`;
    } else {
      sentence += ".";
    }

    stats.replaceChildren(...items);
    summary.textContent = sentence;
    results.hidden = false;
  }

  input.addEventListener("input", () => calculate({ showEmptyError: false }));
  monthly.addEventListener("change", () => calculate({ showEmptyError: false }));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate({ showEmptyError: true });
    if (input.getAttribute("aria-invalid") === "true") input.focus();
  });
}
