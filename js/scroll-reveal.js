/**
 * scroll-reveal.js — появление блоков при прокрутке.
 * Элементы с классом .scroll-reveal получают .is-visible в зоне видимости.
 * Подключать на index.html, catalog.html и др.
 */
(() => {
  const elements = document.querySelectorAll(".scroll-reveal");
  if (!elements.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  elements.forEach((el) => observer.observe(el));
})();
