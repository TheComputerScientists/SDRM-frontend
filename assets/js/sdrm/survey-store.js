// Saved survey answers for the persona page (persona.js).
// Stored in localStorage as { role, group, interest, availability }.
export const STORAGE_KEY = "sdrm-persona";

export function readPersona() {
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
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function savePersona(persona) {
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
