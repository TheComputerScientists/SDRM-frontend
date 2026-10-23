const STORAGE_KEY = "sdrm-theme";
const THEMES = new Set(["default", "forest", "sunset"]);

function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "default";
  } catch (error) {
    console.warn("Unable to read the saved SDRM theme.", error);
    return "default";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Unable to save the SDRM theme.", error);
  }
}

function applyTheme(theme) {
  const selectedTheme = THEMES.has(theme) ? theme : "default";
  if (selectedTheme === "default") {
    document.documentElement.removeAttribute("data-sdrm-theme");
  } else {
    document.documentElement.dataset.sdrmTheme = selectedTheme;
  }
  saveTheme(selectedTheme);
  document.querySelectorAll("[data-sdrm-theme-option]").forEach((option) => {
    option.checked = option.value === selectedTheme;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(readTheme());
  document.querySelectorAll("[data-sdrm-theme-option]").forEach((option) => {
    option.addEventListener("change", () => applyTheme(option.value));
  });
});
