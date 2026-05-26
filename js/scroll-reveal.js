/**
 * scroll-reveal.js — анимация появления блоков при прокрутке.
 * Элементы с классом .scroll-reveal получают .is-visible, когда попадают в viewport.
 * Подключение: index.html, catalog.html.
 */
(() => { // изоляция области видимости

  const elements = document.querySelectorAll(".scroll-reveal"); // все анимируемые блоки
  if (!elements.length) return; // на странице нет таких блоков — выходим

  // У пользователей с «уменьшить движение» сразу показываем всё без анимации
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // IntersectionObserver: следит, когда элемент пересекает область просмотра
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return; // ещё не виден — ничего не делаем
        entry.target.classList.add("is-visible"); // включаем CSS-переход opacity/transform
        observer.unobserve(entry.target); // один раз — больше не наблюдаем
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" } // 12% видимости; снизу отступ 6%
  );

  elements.forEach((el) => observer.observe(el)); // подписка на каждый блок
})();
