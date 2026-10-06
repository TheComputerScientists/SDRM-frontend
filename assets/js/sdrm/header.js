// Collapsible site header menu for small screens (styles in _sass/sdrm/_header.scss).
// Without this script the menu button stays hidden and the nav is always visible.
(() => {
  const header = document.querySelector("[data-sdrm-header]");
  const toggle = header && header.querySelector(".sdrm__header-toggle");
  if (!toggle) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    header.classList.toggle("sdrm__header--open", open);
  };

  header.classList.add("sdrm__header--enhanced");
  toggle.hidden = false;
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
})();
