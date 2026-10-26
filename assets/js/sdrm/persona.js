const STORAGE_KEY = "sdrm-persona";

const QUESTIONS = ["use", "learning", "interest", "goal"];

function readPersona() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Unable to read the saved SDRM persona.", error);
    return {};
  }
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : { use: saved };
  } catch (error) {
    return { use: saved };
  }
}

function savePersona(persona) {
  try {
    if (Object.keys(persona).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persona));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Unable to save the SDRM persona.", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const options = [...document.querySelectorAll("[data-sdrm-persona-option]")];
  const progress = document.querySelector("[data-sdrm-persona-progress]");
  const status = document.querySelector("[data-sdrm-persona-status]");
  const reset = document.querySelector("[data-sdrm-persona-reset]");
  const savedPersona = readPersona();

  if (!options.length || !progress || !status || !reset) return;

  function update(answers, announce) {
    options.forEach((option) => {
      option.checked = option.value === answers[option.dataset.question];
    });
    const selectedCount = QUESTIONS.filter((question) => answers[question]).length;
    progress.textContent = `${selectedCount} of ${QUESTIONS.length} chosen`;
    reset.hidden = selectedCount === 0;
    if (announce) {
      status.textContent = selectedCount === QUESTIONS.length
        ? "Your persona survey has been saved."
        : "Your answer has been saved.";
    }
  }

  const validAnswers = Object.fromEntries(
    QUESTIONS
      .filter((question) => options.some((option) => option.dataset.question === question && option.value === savedPersona[question]))
      .map((question) => [question, savedPersona[question]])
  );
  update(validAnswers, false);

  options.forEach((option) => {
    option.addEventListener("change", () => {
      validAnswers[option.dataset.question] = option.value;
      savePersona(validAnswers);
      update(validAnswers, true);
    });
  });

  reset.addEventListener("click", () => {
    Object.keys(validAnswers).forEach((question) => delete validAnswers[question]);
    savePersona(validAnswers);
    update(validAnswers, false);
    status.textContent = "Your persona survey has been cleared.";
  });
});
