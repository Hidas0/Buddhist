(() => {
  function initMobileNav() {
    const toggle = document.querySelector("[data-mobile-nav-toggle]");
    const panel = document.querySelector("[data-mobile-nav-panel]");
    const backdrop = document.querySelector("[data-mobile-nav-backdrop]");

    if (!toggle || !panel) return;

    function setOpen(open) {
      panel.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("show", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    }

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.contains("open");
      setOpen(!isOpen);
    });

    if (backdrop) {
      backdrop.addEventListener("click", () => setOpen(false));
    }

    panel.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    setOpen(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNav, { once: true });
  } else {
    initMobileNav();
  }
})();

