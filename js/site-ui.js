/**
 * site-ui.js — мобильное меню (бургер).
 * Разметка: [data-mobile-nav-toggle], [data-mobile-nav-panel], [data-mobile-nav-backdrop].
 */
(() => {

  function initMobileNav() {
    const toggle = document.querySelector("[data-mobile-nav-toggle]"); // кнопка «меню»
    const panel = document.querySelector("[data-mobile-nav-panel]"); // выпадающий список ссылок
    const backdrop = document.querySelector("[data-mobile-nav-backdrop]"); // затемнение фона

    if (!toggle || !panel) return; // нет разметки на этой странице

    /** Открыть/закрыть меню и синхронизировать ARIA и класс body.nav-open */
    function setOpen(open) {
      panel.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("show", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open); // блокирует прокрутку в CSS
    }

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.contains("open");
      setOpen(!isOpen); // переключатель
    });

    if (backdrop) {
      backdrop.addEventListener("click", () => setOpen(false)); // клик мимо — закрыть
    }

    panel.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) setOpen(false); // после перехода по ссылке меню закрывается
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false); // Escape — закрыть
    });

    setOpen(false); // начальное состояние: закрыто
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNav, { once: true });
  } else {
    initMobileNav();
  }
})();
