// Collapsible site header menu for small screens (see _sass/open-coding/elements/site-header).
// Without this script the menu button stays hidden and the nav is always visible.
(() => {
  const header = document.querySelector("[data-sdrm-header]");
  const toggle = header && header.querySelector(".ocs__site-header-toggle");
  if (!toggle) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    header.classList.toggle("ocs__site-header--open", open);
  };

  header.classList.add("ocs__site-header--enhanced");
  toggle.hidden = false;
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
})();
