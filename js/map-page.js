/**
 * map-page.js — интерактивная карта (map.html)
 */
(() => {
  const TYPE_PRESETS = {
    святыня: "islands#redIcon",
    монастырь: "islands#orangeIcon",
    паломничество: "islands#violetIcon",
    музей: "islands#blueIcon",
    праздник: "islands#greenIcon",
  };

  const TYPE_LABELS = {
    святыня: "Святыня",
    монастырь: "Монастырь",
    паломничество: "Паломничество",
    музей: "Музей / учебный центр",
    праздник: "Праздник / обряд",
  };

  const LIFE_ERAS = ["birth", "enlighten", "teach", "parinirvana"];

  const ERA_STEPS = [
    { key: "all", label: "Все эпохи", filter: () => true },
    {
      key: "life",
      label: "Жизнь Будды (VI в. до н. э.)",
      filter: (p) => LIFE_ERAS.includes(p.era),
    },
    {
      key: "heritage",
      label: "Древность и ранний буддизм",
      filter: (p) => p.era === "heritage",
    },
    {
      key: "medieval",
      label: "Средневековье (V–XIV вв.)",
      filter: (p) => p.era === "medieval",
    },
    {
      key: "spread",
      label: "Распространение в Азии",
      filter: (p) => p.era === "spread",
    },
    {
      key: "revival",
      label: "Возрождение в России и Монголии",
      filter: (p) => p.era === "revival",
    },
    {
      key: "living",
      label: "Современность",
      filter: (p) => p.era === "living",
    },
  ];

  const PRESETS = {
    all: {
      label: "Весь мир",
      filter: () => true,
      zoom: 3,
      center: [30, 90],
      showRoute: false,
    },
    four: {
      label: "4 святыни Будды",
      filter: (p) => p.routeOrder,
      showRoute: true,
    },
    tibet: {
      label: "Тибет",
      filter: (p) => /тибет/i.test(p.region),
      showRoute: false,
    },
    russia: {
      label: "Россия",
      filter: (p) => /россия/i.test(p.region),
      showRoute: false,
    },
    asia: {
      label: "Юго-Восточная Азия",
      filter: (p) =>
        /индонезия|мьянма|япония|таиланд|камбоджа|вьетнам|корея|шри-ланка|малайзия|сингапур/i.test(
          p.region
        ),
      showRoute: false,
      center: [15, 110],
      zoom: 4,
    },
  };

  const ROUTE_IDS = ["lumbini", "bodhgaya", "sarnath", "kushinagar"];

  let allPlaces = [];
  let map = null;
  let clusterer = null;
  let routeLine = null;
  let geoObjects = [];
  let currentPlacemark = null;
  let userCoords = null;
  let userPlacemark = null;
  let activeTypeFilter = "all";
  let activeEraIndex = 0;
  let activePresetId = "all";
  let showRoute = false;
  let panoramaPlayer = null;
  let panoramaOpenGen = 0;
  let suppressMapClickUntil = 0;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function placeImg(place) {
    return escapeHtml(place.image || "images/hero.png");
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("map-scroll-locked");
    document.body.classList.remove("map-panorama-open");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  function lockPageScroll() {
    document.documentElement.classList.add("map-scroll-locked");
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  }

  function getYandexPanoramaUrl(coords) {
    const [lat, lon] = coords;
    const ll = `${lon},${lat}`;
    return `https://yandex.ru/maps/?ll=${encodeURIComponent(ll)}&z=17&panorama%5Bpoint%5D=${encodeURIComponent(ll)}&panorama%5Bdirection%5D=0%2C0&panorama%5Bspan%5D=90%2C30`;
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLon = ((b[1] - a[1]) * Math.PI) / 180;
    const lat1 = (a[0] * Math.PI) / 180;
    const lat2 = (b[0] * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function getFilteredPlaces() {
    const eraFilter = ERA_STEPS[activeEraIndex].filter;
    const searchVal = (
      document.getElementById("map-search")?.value || ""
    ).toLowerCase().trim();

    const preset = PRESETS[activePresetId];
    return allPlaces.filter((p) => {
      if (preset && activePresetId !== "all" && !preset.filter(p)) return false;
      if (activeTypeFilter !== "all" && p.type !== activeTypeFilter) return false;
      if (!eraFilter(p)) return false;
      if (searchVal) {
        const hay = `${p.name} ${p.region} ${p.description} ${p.story}`.toLowerCase();
        if (!hay.includes(searchVal)) return false;
      }
      return true;
    });
  }

  function calculateBounds(places) {
    if (!places.length) return null;
    const lats = places.map((p) => p.coords[0]);
    const lons = places.map((p) => p.coords[1]);
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  }

  function setActiveListItem(placeId) {
    document.querySelectorAll(".map-list__item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.id === placeId);
    });
  }

  function resetPlacemarkStyle(pm) {
    const place = pm.properties.get("placeData");
    if (!place) return;
    pm.options.set("preset", TYPE_PRESETS[place.type] || "islands#grayIcon");
  }

  function hidePlacePanel() {
    document.getElementById("map-place-panel")?.classList.add("hidden");
  }

  function bindPlacePanelActions(container, place) {
    container.querySelector(".map-panorama-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.showMapPanorama?.(place);
    });
    container.querySelector(".map-place-panel__close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePlacePanel();
      document.querySelectorAll(".map-list__item").forEach((el) => el.classList.remove("is-active"));
      if (currentPlacemark) {
        resetPlacemarkStyle(currentPlacemark);
        currentPlacemark = null;
      }
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function renderPlacePanel(place) {
    const panel = document.getElementById("map-place-panel");
    if (!panel) return;

    const dist = userCoords
      ? `<p class="map-place-panel__distance"><i data-lucide="navigation"></i> ~${haversineKm(userCoords, place.coords).toFixed(0)} км</p>`
      : "";
    const excerpt = (place.story || place.description || "").slice(0, 220);
    const tail = (place.story || place.description || "").length > 220 ? "…" : "";

    panel.innerHTML = `
      <button type="button" class="map-place-panel__close" aria-label="Закрыть">&times;</button>
      <img class="map-place-panel__photo" src="${placeImg(place)}" alt="${escapeHtml(place.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='images/hero.png'">
      <span class="map-type-badge map-type-badge--${escapeHtml(place.type)}">${escapeHtml(TYPE_LABELS[place.type] || place.type)}</span>
      <h3>${escapeHtml(place.name)}</h3>
      <p class="map-place-panel__region">${escapeHtml(place.region)}</p>
      <p class="map-place-panel__desc">${escapeHtml(excerpt)}${tail}</p>
      ${dist}
      <button type="button" class="btn btn-primary map-panorama-btn">
        <i data-lucide="scan-eye"></i>
        Уличная панорама
      </button>
    `;
    panel.classList.remove("hidden");
    bindPlacePanelActions(panel, place);
  }

  function selectPlace(place, placemark) {
    if (!place || !map) return;

    suppressMapClickUntil = Date.now() + 250;
    map.setCenter(place.coords, 12, { duration: 350 });

    if (currentPlacemark) resetPlacemarkStyle(currentPlacemark);
    if (placemark) {
      placemark.options.set("preset", "islands#blueIcon");
      currentPlacemark = placemark;
    }

    setActiveListItem(place.id);
    renderPlacePanel(place);
  }

  function renderList(places) {
    const list = document.getElementById("map-list");
    const countEl = document.getElementById("map-count");
    if (!list) return;

    if (countEl) countEl.textContent = `${places.length} ${places.length === 1 ? "место" : places.length < 5 ? "места" : "мест"}`;

    if (!places.length) {
      list.innerHTML = `<li class="map-list__empty">Ничего не найдено. Измените фильтры или поиск.</li>`;
      return;
    }

    const sorted = [...places];
    if (userCoords) {
      sorted.sort(
        (a, b) =>
          haversineKm(userCoords, a.coords) - haversineKm(userCoords, b.coords)
      );
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    list.innerHTML = sorted
      .map((place) => {
        const km =
          userCoords &&
          `<span class="map-list__km">${haversineKm(userCoords, place.coords).toFixed(0)} км</span>`;
        return `
          <li class="map-list__item" data-id="${escapeHtml(place.id)}" role="button" tabindex="0">
            <img class="map-list__thumb" src="${placeImg(place)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='images/hero.png'">
            <div class="map-list__text">
              <span class="map-list__type map-type-badge map-type-badge--${escapeHtml(place.type)}">${escapeHtml(TYPE_LABELS[place.type] || "")}</span>
            <strong>${escapeHtml(place.name)}</strong>
            <span class="map-list__desc">${escapeHtml(place.description || "")}</span>
            <span class="map-list__meta">${escapeHtml(place.region)}</span>
            ${km || ""}
            </div>
          </li>
        `;
      })
      .join("");

    list.querySelectorAll(".map-list__item").forEach((item) => {
      const id = item.dataset.id;
      const place = places.find((p) => p.id === id);
      const open = () => {
        const pm = geoObjects.find(
          (g) => g.properties.get("placeData")?.id === id
        );
        selectPlace(place, pm);
      };
      item.addEventListener("click", open);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function updateRouteLine(places) {
    if (!map) return;
    if (routeLine) {
      map.geoObjects.remove(routeLine);
      routeLine = null;
    }
    if (!showRoute) return;

    const routePlaces = ROUTE_IDS.map((rid) =>
      allPlaces.find((p) => p.id === rid)
    ).filter(Boolean);
    if (routePlaces.length < 2) return;

    routeLine = new ymaps.Polyline(
      routePlaces.map((p) => p.coords),
      { balloonContent: "Маршрут четырёх главных святынь жизни Будды" },
      {
        strokeColor: "#b45309",
        strokeWidth: 4,
        strokeOpacity: 0.85,
        strokeStyle: "shortdash",
      }
    );
    map.geoObjects.add(routeLine);
  }

  function renderMapMarkers(places) {
    if (!clusterer) return;

    clusterer.removeAll();
    geoObjects = [];

    places.forEach((place) => {
      const placemark = new ymaps.Placemark(
        place.coords,
        {
          hintContent: `${place.name} — ${place.description}`,
        },
        {
          preset: TYPE_PRESETS[place.type] || "islands#grayIcon",
          openBalloonOnClick: false,
        }
      );

      placemark.properties.set("placeData", place);
      placemark.events.add("click", (e) => {
        e.preventDefault();
        suppressMapClickUntil = Date.now() + 250;
        selectPlace(
          e.get("target").properties.get("placeData"),
          e.get("target")
        );
      });

      geoObjects.push(placemark);
    });

    clusterer.add(geoObjects);
    updateRouteLine(places);
    renderList(places);

    if (places.length === 1) {
      map.setCenter(places[0].coords, 10, { duration: 300 });
    } else if (places.length > 1) {
      const bounds = calculateBounds(places);
      if (bounds) {
        map.setBounds(bounds, { checkZoomRange: true, duration: 400, zoomMargin: 48 });
      }
    }
  }

  function applyView() {
    const places = getFilteredPlaces();
    renderMapMarkers(places);

    const activeId = document.querySelector(".map-list__item.is-active")?.dataset.id;
    if (activeId && !places.find((p) => p.id === activeId)) {
      hidePlacePanel();
      if (currentPlacemark) {
        resetPlacemarkStyle(currentPlacemark);
        currentPlacemark = null;
      }
    }
  }

  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;

    activePresetId = presetId;
    updatePresetChips();

    showRoute = !!preset.showRoute;
    const routeBtn = document.getElementById("map-route-toggle");
    if (routeBtn) routeBtn.classList.toggle("active", showRoute);

    if (presetId === "four") {
      activeEraIndex = 1;
      const slider = document.getElementById("map-era-slider");
      if (slider) slider.value = "1";
      updateEraLabel();
    }

    const search = document.getElementById("map-search");
    if (search) search.value = "";

    applyView();

    const places = getFilteredPlaces();
    if (preset.center && preset.zoom && !places.length) {
      map.setCenter(preset.center, preset.zoom, { duration: 400 });
      return;
    }
    if (places.length) {
      const bounds = calculateBounds(places);
      if (bounds) map.setBounds(bounds, { checkZoomRange: true, duration: 450, zoomMargin: 56 });
    } else if (preset.center && preset.zoom) {
      map.setCenter(preset.center, preset.zoom, { duration: 400 });
    }
  }

  function updatePresetChips() {
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === activePresetId);
    });
  }

  function updateTypeChips() {
    document.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === activeTypeFilter);
    });
  }

  function clearPresetSelection() {
    activePresetId = "all";
    updatePresetChips();
  }

  function updateEraLabel() {
    const label = document.getElementById("map-era-label");
    if (label) label.textContent = ERA_STEPS[activeEraIndex].label;
  }

  function destroyPanoramaPlayer() {
    if (!panoramaPlayer) return;
    try {
      if (typeof panoramaPlayer.destroy === "function") panoramaPlayer.destroy();
    } catch (_) {
      /* ignore */
    }
    panoramaPlayer = null;
  }

  function getPanoramaSearchPoints(target) {
    if (Array.isArray(target) && typeof target[0] === "number") {
      return [target];
    }
    const base = target.panoramaCoords || target.coords;
    const [lat, lon] = base;
    const d = 0.0015;
    const d2 = 0.004;
    return [
      base,
      [lat + d, lon],
      [lat - d, lon],
      [lat, lon + d],
      [lat, lon - d],
      [lat + d2, lon],
      [lat - d2, lon],
      [lat, lon + d2],
      [lat, lon - d2],
    ];
  }

  function pickBestPanorama(panoramas, target) {
    let best = panoramas[0];
    let bestD = Infinity;
    panoramas.forEach((p) => {
      const pos = p.getPosition?.();
      if (!pos) return;
      const d = (pos[0] - target[0]) ** 2 + (pos[1] - target[1]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    });
    return best;
  }

  async function ensurePanoramaModule() {
    if (ymaps.panorama?.locate) return true;
    try {
      await ymaps.modules.require(["panorama"]);
    } catch (_) {
      /* module unavailable */
    }
    return !!ymaps.panorama?.locate;
  }

  function showPanoramaFallback(container, coords, message) {
    const url = getYandexPanoramaUrl(coords);
    container.innerHTML = `
      <div class="map-panorama-loading">
        <p>${escapeHtml(message)}</p>
        <div class="map-panorama-fallback">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Открыть на Яндекс.Картах</a>
          <button type="button" class="btn btn-secondary map-panorama-fallback-close">Закрыть</button>
        </div>
      </div>`;
    container
      .querySelector(".map-panorama-fallback-close")
      ?.addEventListener("click", () => window.closePanorama());
  }

  function showPanoramaLoading(container, coords) {
    const url = getYandexPanoramaUrl(coords);
    container.innerHTML = `
      <div class="map-panorama-loading">
        <p>Загрузка панорамы…</p>
        <div class="map-panorama-fallback">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Открыть на Яндекс.Картах</a>
          <button type="button" class="btn btn-secondary map-panorama-fallback-close">Отмена</button>
        </div>
      </div>`;
    container
      .querySelector(".map-panorama-fallback-close")
      ?.addEventListener("click", () => window.closePanorama());
  }

  async function findNearestPanorama(points) {
    if (!ymaps.panorama?.locate) return null;
    for (const pt of points) {
      try {
        const panoramas = await withTimeout(ymaps.panorama.locate(pt), 7000);
        if (panoramas?.length) return { panoramas, point: pt };
      } catch (_) {
        /* try next point */
      }
    }
    return null;
  }

  function initPanorama() {
    window.showMapPanorama = async function showMapPanorama(target) {
      const modal = document.getElementById("panorama-modal");
      const container = document.getElementById("panorama-container");
      if (!modal || !container) return;

      const points = getPanoramaSearchPoints(target);
      const anchor = points[0];

      const openGen = ++panoramaOpenGen;
      suppressMapClickUntil = Date.now() + 400;
      modal.removeAttribute("hidden");
      modal.classList.add("is-open");
      lockPageScroll();
      destroyPanoramaPlayer();
      container.style.height = "";
      showPanoramaLoading(container, anchor);

      try {
        const hasModule = await withTimeout(ensurePanoramaModule(), 5000).catch(() => false);
        if (!hasModule) {
          showPanoramaFallback(
            container,
            anchor,
            "Встроенная панорама недоступна — откройте просмотр на Яндекс.Картах."
          );
          return;
        }

        const found = await findNearestPanorama(points);
        if (!found) {
          showPanoramaFallback(
            container,
            anchor,
            "Рядом с этой точкой нет уличной панорамы. Откройте ближайший участок на Яндекс.Картах."
          );
          return;
        }

        const best = pickBestPanorama(found.panoramas, anchor);
        container.innerHTML = "";
        container.style.height = "calc(100vh - 72px)";
        container.style.minHeight = "400px";

        panoramaPlayer = new ymaps.panorama.Player(container, best, {
          direction: [0, 0],
          controls: ["zoomControl", "fullscreenControl"],
        });

        setTimeout(() => {
          if (openGen !== panoramaOpenGen) return;
          if (!modal.classList.contains("is-open")) return;
          if (container.querySelector(".map-panorama-loading")) return;
          if (container.childElementCount === 0) {
            showPanoramaFallback(
              container,
              anchor,
              "Панорама не отобразилась. Откройте просмотр на Яндекс.Картах."
            );
          }
        }, 3000);
      } catch (_) {
        showPanoramaFallback(
          container,
          anchor,
          "Не удалось загрузить панораму. Откройте просмотр на Яндекс.Картах."
        );
      }
    };

    window.closePanorama = function closePanorama() {
      panoramaOpenGen += 1;
      destroyPanoramaPlayer();
      const modal = document.getElementById("panorama-modal");
      const container = document.getElementById("panorama-container");
      if (container) {
        container.innerHTML = "";
        container.style.height = "";
      }
      if (modal) {
        modal.setAttribute("hidden", "");
        modal.classList.remove("is-open");
      }
      unlockPageScroll();
      suppressMapClickUntil = 0;
    };

    document.getElementById("panorama-close-btn")?.addEventListener("click", () => {
      window.closePanorama();
    });
    document.querySelectorAll("[data-panorama-close]").forEach((el) => {
      el.addEventListener("click", () => window.closePanorama());
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("panorama-modal")?.classList.contains("is-open")) {
        window.closePanorama();
      }
    });
  }

  function initMapScrollFix() {
    if (!map) return;

    const mapEl = document.getElementById("map");
    const panel = document.getElementById("map-place-panel");
    if (panel && !panel.dataset.bound) {
      panel.dataset.bound = "1";
      panel.addEventListener("mousedown", (e) => e.stopPropagation());
      panel.addEventListener("click", (e) => e.stopPropagation());
      panel.addEventListener("dblclick", (e) => e.stopPropagation());
    }
    map.events.add("actionend", () => {
      if (!document.getElementById("panorama-modal")?.classList.contains("is-open")) {
        unlockPageScroll();
      }
    });

    mapEl?.addEventListener("mouseleave", () => {
      if (!document.getElementById("panorama-modal")?.classList.contains("is-open")) {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    });
  }

  function initGeolocation() {
    const btn = document.getElementById("map-near-me");
    if (!btn || !navigator.geolocation) {
      btn?.setAttribute("disabled", "true");
      return;
    }

    btn.addEventListener("click", () => {
      btn.classList.add("is-loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userCoords = [pos.coords.latitude, pos.coords.longitude];
          btn.classList.remove("is-loading");
          btn.classList.add("active");

          if (userPlacemark) map.geoObjects.remove(userPlacemark);
          userPlacemark = new ymaps.Placemark(
            userCoords,
            { hintContent: "Вы здесь" },
            { preset: "islands#geolocationIcon" }
          );
          map.geoObjects.add(userPlacemark);
          map.setCenter(userCoords, 5, { duration: 500 });
          applyView();
        },
        () => {
          btn.classList.remove("is-loading");
          alert("Не удалось определить местоположение. Разрешите доступ к геолокации в браузере.");
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  }

  function bindControls() {
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
    });

    document.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTypeFilter = btn.dataset.filter;
        updateTypeChips();
        applyView();
      });
    });

    document.getElementById("map-search")?.addEventListener("input", () => {
      clearPresetSelection();
      applyView();
    });

    document.getElementById("map-era-slider")?.addEventListener("input", (e) => {
      clearPresetSelection();
      activeEraIndex = Number(e.target.value);
      updateEraLabel();
      applyView();
    });

    document.getElementById("map-route-toggle")?.addEventListener("click", (e) => {
      showRoute = !showRoute;
      e.currentTarget.classList.toggle("active", showRoute);
      updateRouteLine(getFilteredPlaces());
    });

    map.events.add("click", () => {
      if (Date.now() < suppressMapClickUntil) return;
      map.balloon?.close();
      hidePlacePanel();
      document.querySelectorAll(".map-list__item").forEach((el) => el.classList.remove("is-active"));
      if (currentPlacemark) {
        resetPlacemarkStyle(currentPlacemark);
        currentPlacemark = null;
      }
      unlockPageScroll();
    });
  }

  function showMapLoadError(message) {
    const list = document.getElementById("map-list");
    const mapEl = document.getElementById("map");
    const countEl = document.getElementById("map-count");
    if (countEl) countEl.textContent = "—";
    if (list) {
      list.innerHTML = `<li class="map-list__empty">${escapeHtml(message)}</li>`;
    }
    if (mapEl) {
      mapEl.innerHTML = `<div class="map-load-error"><p>${escapeHtml(message)}</p><p>Откройте сайт через локальный сервер или GitHub Pages, не как файл <code>file://</code>.</p></div>`;
    }
  }

  async function init() {
    unlockPageScroll();
    initPanorama();

    const [placesRes, imagesRes] = await Promise.all([
      fetch("data/places.json", { cache: "no-cache" }),
      fetch("data/place-images.json", { cache: "no-cache" }),
    ]);

    if (!placesRes.ok) {
      throw new Error(`Не удалось загрузить data/places.json (${placesRes.status})`);
    }

    const places = await placesRes.json();
    let images = {};
    if (imagesRes.ok) {
      try {
        images = await imagesRes.json();
      } catch (_) {
        /* optional */
      }
    }

    allPlaces = places
      .filter((p) => p.type !== "музей" && p.type !== "праздник")
      .map((p) => ({
        ...p,
        image: images[p.id] || p.image,
      }));

    map = new ymaps.Map(
      "map",
      {
        center: [46, 95],
        zoom: 4,
        controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
      },
      { suppressMapOpenBlock: true }
    );

    clusterer = new ymaps.Clusterer({
      preset: "islands#invertedGoldClusterIcons",
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      gridSize: 64,
    });
    map.geoObjects.add(clusterer);

    initMapScrollFix();
    bindControls();
    initGeolocation();
    updateEraLabel();
    updatePresetChips();
    updateTypeChips();
    applyPreset("all");

    if (window.lucide) window.lucide.createIcons();
  }

  if (typeof ymaps !== "undefined") {
    ymaps.ready(() => {
      init().catch((err) => {
        console.error("Map init failed:", err);
        showMapLoadError(
          err?.message || "Ошибка инициализации карты. Обновите страницу."
        );
      });
    });
  } else {
    showMapLoadError("Яндекс.Карты не загрузились. Проверьте интернет и обновите страницу.");
  }

  window.addEventListener("pagehide", unlockPageScroll);
})();
