(() => {
  const SCROLL_SHOW_Y = 400;
  const SCROLL_TOP_EPSILON = 4;
  const ANIM_CLASS = "is-scrolling";

  function getButton() {
    return (
      document.getElementById("backTopBtn") ||
      document.querySelector(".back-to-top")
    );
  }

  function updateVisibility(btn) {
    if (window.scrollY > SCROLL_SHOW_Y) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  }

  function init() {
    const btn = getButton();
    if (!btn) return;

    updateVisibility(btn);

    window.addEventListener(
      "scroll",
      () => {
        updateVisibility(btn);
      },
      { passive: true }
    );

    btn.addEventListener("click", () => {
      btn.classList.add(ANIM_CLASS);
      window.scrollTo({ top: 0, behavior: "smooth" });

      let lastY = window.scrollY;
      let stableTicks = 0;

      const stop = () => {
        btn.classList.remove(ANIM_CLASS);
        window.removeEventListener("scroll", onScrollStop);
      };

      const onScrollStop = () => {
        const y = window.scrollY;
        if (y <= SCROLL_TOP_EPSILON) return stop();

        if (Math.abs(y - lastY) < 0.5) {
          stableTicks += 1;
        } else {
          stableTicks = 0;
        }
        lastY = y;

        // Если браузер/пользователь остановил плавную прокрутку — снимаем анимацию.
        if (stableTicks >= 8) stop();
      };

      window.addEventListener("scroll", onScrollStop, { passive: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

