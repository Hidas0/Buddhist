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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function selectPlace(place, placemark) {
    if (!place || !map) return;

    map.setCenter(place.coords, 12, { duration: 350 });

    if (currentPlacemark) resetPlacemarkStyle(currentPlacemark);
    if (placemark) {
      placemark.options.set("preset", "islands#blueIcon");
      currentPlacemark = placemark;
    }

    setActiveListItem(place.id);
    renderDetailCard(place);
  }

  function renderDetailCard(place) {
    const card = document.getElementById("place-card");
    if (!card) return;

    const dist = userCoords
      ? `<p class="map-detail__distance"><i data-lucide="navigation"></i> ~${haversineKm(userCoords, place.coords).toFixed(0)} км от вас</p>`
      : "";

    card.innerHTML = `
      <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" loading="lazy">
      <div class="map-detail__body">
        <span class="map-type-badge map-type-badge--${escapeHtml(place.type)}">${escapeHtml(TYPE_LABELS[place.type] || place.type)}</span>
        <h3>${escapeHtml(place.name)}</h3>
        <p class="map-detail__region">${escapeHtml(place.region)}</p>
        <p class="map-detail__story">${escapeHtml(place.story || place.description)}</p>
        ${dist || ""}
        <button type="button" class="btn btn-primary map-panorama-btn" data-place-id="${escapeHtml(place.id)}">
          <i data-lucide="scan-eye"></i>
          Уличная панорама
        </button>
      </div>
    `;
    card.classList.remove("hidden");

    card.querySelector(".map-panorama-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.showMapPanorama?.(place);
    });

    if (window.lucide) window.lucide.createIcons();
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
            <span class="map-list__type map-type-badge map-type-badge--${escapeHtml(place.type)}">${escapeHtml(TYPE_LABELS[place.type] || "")}</span>
            <strong>${escapeHtml(place.name)}</strong>
            <span class="map-list__meta">${escapeHtml(place.region)}</span>
            ${km || ""}
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
          balloonContentHeader: place.name,
          balloonContentBody: `
            <div class="map-balloon">
              <img src="${escapeHtml(place.image)}" alt="">
              <p><strong>${escapeHtml(place.description)}</strong></p>
              <p>${escapeHtml((place.story || "").slice(0, 220))}…</p>
              <small>${escapeHtml(place.region)}</small>
              <button type="button" class="map-balloon-pano" onclick="window.openMapPanoramaById('${escapeHtml(place.id)}')">Уличная панорама</button>
            </div>
          `,
          hintContent: place.name,
        },
        { preset: TYPE_PRESETS[place.type] || "islands#grayIcon" }
      );

      placemark.properties.set("placeData", place);
      placemark.events.add("click", (e) => {
        e.stopPropagation();
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

    const card = document.getElementById("place-card");
    if (card && places.length) {
      /* keep card if selection still visible */
      const activeId = document.querySelector(".map-list__item.is-active")?.dataset.id;
      if (activeId && !places.find((p) => p.id === activeId)) {
        card.classList.add("hidden");
        if (currentPlacemark) {
          resetPlacemarkStyle(currentPlacemark);
          currentPlacemark = null;
        }
      }
    } else if (card) {
      card.classList.add("hidden");
    }
  }

  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;

    activePresetId = presetId;

    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === presetId);
    });

    showRoute = !!preset.showRoute;
    const routeBtn = document.getElementById("map-route-toggle");
    if (routeBtn) routeBtn.classList.toggle("active", showRoute);

    if (presetId === "four") {
      activeEraIndex = 1;
      const slider = document.getElementById("map-era-slider");
      if (slider) slider.value = "1";
      updateEraLabel();
    }

    activeTypeFilter = "all";
    document.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === "all");
    });

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

  function clearPresetSelection() {
    activePresetId = "all";
    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.preset === "all");
    });
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

  async function findNearestPanorama(points) {
    if (!ymaps.panorama?.locate) return null;
    for (const pt of points) {
      try {
        const panoramas = await ymaps.panorama.locate(pt);
        if (panoramas?.length) return { panoramas, point: pt };
      } catch (_) {
        /* try next point */
      }
    }
    return null;
  }

  function initPanorama() {
    window.openMapPanoramaById = function openMapPanoramaById(id) {
      const place = allPlaces.find((p) => p.id === id);
      if (place) window.showMapPanorama(place);
    };

    window.showMapPanorama = async function showMapPanorama(target) {
      const modal = document.getElementById("panorama-modal");
      const container = document.getElementById("panorama-container");
      if (!modal || !container) return;

      const points = getPanoramaSearchPoints(target);
      const anchor = points[0];

      modal.removeAttribute("hidden");
      modal.classList.add("is-open");
      document.body.classList.add("map-panorama-open");
      destroyPanoramaPlayer();
      container.innerHTML =
        '<div class="map-panorama-loading">Загрузка панорамы…</div>';

      if (!ymaps.panorama?.locate) {
        container.innerHTML =
          '<div class="map-panorama-loading"><p>Модуль панорам не загружен. Обновите страницу.</p><button type="button" class="btn btn-primary" onclick="closePanorama()">Закрыть</button></div>';
        return;
      }

      try {
        const found = await findNearestPanorama(points);
        if (!found) {
          container.innerHTML =
            '<div class="map-panorama-loading"><p>Уличная панорама рядом с этой точкой пока недоступна — попробуйте другое место на карте.</p><button type="button" class="btn btn-primary" onclick="closePanorama()">Закрыть</button></div>';
          return;
        }
        const best = pickBestPanorama(found.panoramas, anchor);
        container.innerHTML = "";
        panoramaPlayer = new ymaps.panorama.Player(container, best, {
          direction: [0, 0],
          controls: ["zoomControl", "fullscreenControl"],
        });
      } catch (_) {
        container.innerHTML =
          '<div class="map-panorama-loading"><p>Не удалось загрузить панораму.</p><button type="button" class="btn btn-primary" onclick="closePanorama()">Закрыть</button></div>';
      }
    };

    window.closePanorama = function closePanorama() {
      destroyPanoramaPlayer();
      const modal = document.getElementById("panorama-modal");
      const container = document.getElementById("panorama-container");
      if (container) container.innerHTML = "";
      if (modal) {
        modal.setAttribute("hidden", "");
        modal.classList.remove("is-open");
      }
      document.body.classList.remove("map-panorama-open");
    };

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") window.closePanorama?.();
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
        clearPresetSelection();
        document.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTypeFilter = btn.dataset.filter;
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
      document.getElementById("place-card")?.classList.add("hidden");
      document.querySelectorAll(".map-list__item").forEach((el) => el.classList.remove("is-active"));
      if (currentPlacemark) {
        resetPlacemarkStyle(currentPlacemark);
        currentPlacemark = null;
      }
    });
  }

  async function init() {
    initPanorama();

    const res = await fetch("data/places.json", { cache: "no-cache" });
    allPlaces = await res.json();

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

    bindControls();
    initGeolocation();
    updateEraLabel();
    applyPreset("all");

    if (window.lucide) window.lucide.createIcons();
  }

  if (typeof ymaps !== "undefined") {
    ymaps.ready(init);
  } else {
    console.error("Yandex Maps API не загружен");
  }
})();
