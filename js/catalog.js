/**
 * catalog.js — страница «Традиции» (catalog.html):
 * фильтры, URL ?filter=, счётчик, статистика, якорное меню, сворачивание карточек.
 */
(() => {
  const filterContainer = document.getElementById("interestFilter");
  const filterButtons = document.querySelectorAll(".interest-btn");
  const categorySections = document.querySelectorAll(".category-section[data-interest]");
  const filterStatusEl = document.getElementById("filterStatus");
  const statsNoteEl = document.getElementById("statsNote");
  const statsGrid = document.getElementById("catalogStats");
  const sectionNav = document.getElementById("catalogSectionNav");
  const navLinks = sectionNav
    ? [...sectionNav.querySelectorAll(".catalog-section-nav__link")]
    : [];

  const STAT_NOTES = {
    all: "Цифры отражают масштаб буддизма в мире",
    peoples: "В фильтре: обычаи и праздники пяти регионов — ядро темы «народы»",
    practice: "В фильтре: медитация и мантры — 6 практик",
    culture: "В фильтре: ритуалы, праздники, паломничество и народы",
    travel: "В фильтре: священные места и маршруты",
    beginner: "В фильтре: понятные темы для первого знакомства",
  };

  function countVisible() {
    let sections = 0;
    let cards = 0;
    categorySections.forEach((section) => {
      if (section.classList.contains("is-filter-hidden")) return;
      sections += 1;
      cards += section.querySelectorAll(".tradition-card").length;
    });
    return { sections, cards };
  }

  function updateFilterStatus() {
    const { sections, cards } = countVisible();
    if (filterStatusEl) {
      const sectionWord =
        sections === 1 ? "раздел" : sections >= 2 && sections <= 4 ? "раздела" : "разделов";
      const cardWord =
        cards === 1 ? "карточка" : cards >= 2 && cards <= 4 ? "карточки" : "карточек";
      filterStatusEl.textContent = `Показано ${sections} ${sectionWord} · ${cards} ${cardWord}`;
    }
  }

  function updateStatsNote(filterValue) {
    if (!statsNoteEl) return;
    statsNoteEl.textContent = STAT_NOTES[filterValue] || STAT_NOTES.all;
  }

  function applyFilter(filterValue) {
    categorySections.forEach((section) => {
      const tags = section.dataset.interest || "";
      const show = filterValue === "all" || tags.includes(filterValue);
      section.classList.toggle("is-filter-hidden", !show);
      section.setAttribute("aria-hidden", show ? "false" : "true");
    });
    updateFilterStatus();
    updateStatsNote(filterValue);
  }

  function setActiveFilter(filterValue, updateUrl = true) {
    const value = filterValue || "all";
    filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === value);
    });
    applyFilter(value);
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (value === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", value);
      history.replaceState(null, "", url);
    }
  }

  if (filterContainer) {
    filterContainer.addEventListener("click", (event) => {
      const button = event.target.closest(".interest-btn");
      if (!button) return;
      setActiveFilter(button.dataset.filter || "all");
    });
  }

  const quickLinks = document.getElementById("quickLinks");
  if (quickLinks) {
    quickLinks.addEventListener("click", (event) => {
      const button = event.target.closest(".quick-link-btn");
      if (!button) return;
      const nextFilter = button.dataset.filter || "all";
      const targetId = button.dataset.target;
      if (nextFilter) setActiveFilter(nextFilter);
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const initialFilter = new URLSearchParams(window.location.search).get("filter");
  if (initialFilter && [...filterButtons].some((b) => b.dataset.filter === initialFilter)) {
    setActiveFilter(initialFilter, false);
  } else {
    applyFilter("all");
  }

  /* Hero CTA */
  document.querySelectorAll("[data-catalog-cta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.catalogCta;
      if (action === "beginner") {
        setActiveFilter("beginner");
        const faq = document.getElementById("catalog-faq");
        if (faq) faq.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "practice") {
        setActiveFilter("practice");
        const med = document.getElementById("meditation");
        if (med) med.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* Сворачивание длинных карточек */
  document.querySelectorAll(".tradition-body").forEach((body) => {
    const lead = body.querySelector(":scope > p");
    if (!lead) return;

    const siblings = [];
    let node = lead.nextElementSibling;
    while (node) {
      siblings.push(node);
      node = node.nextElementSibling;
    }
    if (!siblings.length) return;

    const extra = document.createElement("div");
    extra.className = "tradition-card__extra";
    extra.id = `extra-${Math.random().toString(36).slice(2, 9)}`;
    siblings.forEach((el) => extra.appendChild(el));

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "tradition-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", extra.id);
    toggle.innerHTML =
      'Подробнее <i data-lucide="chevron-down" aria-hidden="true"></i>';

    toggle.addEventListener("click", () => {
      const open = extra.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open
        ? 'Свернуть <i data-lucide="chevron-up" aria-hidden="true"></i>'
        : 'Подробнее <i data-lucide="chevron-down" aria-hidden="true"></i>';
      if (window.lucide) window.lucide.createIcons();
    });

    body.appendChild(extra);
    body.appendChild(toggle);
  });

  /* FAQ */
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      if (item) item.classList.toggle("open");
    });
  });

  /* Sticky-навигация: подсветка активного раздела */
  if (sectionNav && navLinks.length) {
    const sectionIds = navLinks
      .map((a) => a.getAttribute("href")?.replace("#", ""))
      .filter(Boolean);

    const observeSections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${id}`
            );
          });
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    observeSections.forEach((el) => navObserver.observe(el));

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href?.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  if (window.lucide) window.lucide.createIcons();
})();
