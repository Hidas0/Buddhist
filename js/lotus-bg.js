(() => {
  const LOTUS_COUNT = 16;
  const PETAL_BURST_COUNT = 14;
  const WAVE_MAX_RADIUS_PX = 460;
  /** ~px «задержка старта» фронта относительно центра клика (подгонка к радиальному фону) */
  const WAVE_START_RADIUS_PX = 11;
  const GLOBAL_WAVE_DURATION_MS = 2300;
  const WAVE_HIT_ANIM_MS = 1720;
  const FLOAT_TICK_MS = 48;
  const LOTUS_QUOTES = [
    "Отпусти то, что не принадлежит тебе. Освободившись, ты надолго обретешь счастье и благо.",
    "Нелепо думать, что кто-то, кроме тебя, сможет сделать тебя счастливым или несчастным.",
    "Если, отказавшись от меньшего счастья, можно достичь большего, то пусть мудрый откажется от меньшего в надежде обрести большее.",
    "Счастье не придет к тем, кто не умеет ценить того, что уже имеет.",
    "Большая гордость приведет к падению, а смирение - к победе.",
    "Созерцание - произведение добра. Дисциплина - произведение благословенной красоты.",
    "Учитель приходит, когда ученик готов.",
    "Все, чем мы являемся, - это результат того, о чем мы думаем. Разум - это все. Мысли материальны.",
    "Не искажайте труды других и не портите своих.",
    "Все понять - значит все простить.",
    "Победить себя - это более великая задача, чем победить других.",
    "Повторяйте бесконечно безупречное действие, и вашей религией станет мудрость.",
    "Преврати свою жизнь в гирлянду красивых дел.",
    "Доброта - инструктор мира.",
    "Шесть дней для работы, один день для отдыха - идеальная комбинация.",
    "Освободи душу от страха и зависти. Это важнейший шаг в обретении свободы.",
    "Разум может достичь своего предела, когда он начинает задумываться о сути дела.",
    "Не жадничай. Нет такой силы в мире, которая могла бы захватить вечное счастье.",
    "Наши печали и раны исцеляются только тогда, когда мы прикасаемся к ним с состраданием.",
    "Цепляться за чувство гнева - это как пить яд и ожидать, что вместо вас умрет другой человек.",
    "Внешний враг существует только тогда, когда гнев присутствует внутри тебя.",
    "Истинная любовь рождается из понимания.",
    "Если нужно что-то сделать, делай это от всего сердца.",
    "Если ты по-настоящему любишь себя, ты никогда не сможешь причинить боль другому.",
    "В этом мире ненависть никогда не искоренить с помощью ненависти. Победить ненависть сможет только любовь. Это вечный закон."
  ];

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickEdgePosition() {
    const zone = Math.floor(random(0, 4));
    if (zone === 0) return { left: random(3, 16), top: random(8, 92) };
    if (zone === 1) return { left: random(84, 97), top: random(8, 92) };
    if (zone === 2) return { left: random(8, 92), top: random(4, 18) };
    return { left: random(8, 92), top: random(82, 96) };
  }

  function lotusUid() {
    return "l" + Math.random().toString(36).slice(2, 10);
  }

  /** SVG-лотос из макета (широкие лепестки, 3 слоя) — уникальные id градиентов на экземпляр */
  function buildLotusSvg(uid) {
    return `
<svg class="lotus-svg" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-outer" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#e91e8c"/>
      <stop offset="55%" stop-color="#f06292"/>
      <stop offset="100%" stop-color="#f8bbd9"/>
    </linearGradient>
    <linearGradient id="${uid}-mid" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#c2185b"/>
      <stop offset="100%" stop-color="#ec407a"/>
    </linearGradient>
    <linearGradient id="${uid}-inner" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f48fb1"/>
    </linearGradient>
    <radialGradient id="${uid}-center" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff8f0"/>
      <stop offset="45%" stop-color="#f8bbd9"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>
    <g id="${uid}-wide">
      <path d="M 0 0 C -54 -78, -56 -158, 0 -218 C 56 -158, 54 -78, 0 0 Z" fill="url(#${uid}-outer)"/>
    </g>
    <g id="${uid}-mid-petal">
      <path d="M 0 0 C -28 -50, -32 -130, 0 -170 C 32 -130, 28 -50, 0 0 Z" fill="url(#${uid}-mid)"/>
    </g>
    <g id="${uid}-thin">
      <path d="M 0 0 C -11 -22, -12 -72, 0 -105 C 12 -72, 11 -22, 0 0 Z" fill="url(#${uid}-inner)"/>
    </g>
  </defs>
  <g transform="translate(300, 300)">
    <g opacity="1">
      <use href="#${uid}-wide" transform="rotate(0) scale(1.07, 1.1)"/>
      <use href="#${uid}-wide" transform="rotate(30) scale(1.02, 1.06)"/>
      <use href="#${uid}-wide" transform="rotate(60) scale(1.04, 1.03)"/>
      <use href="#${uid}-wide" transform="rotate(90) scale(0.98, 1)"/>
      <use href="#${uid}-wide" transform="rotate(120) scale(0.97, 0.99)"/>
      <use href="#${uid}-wide" transform="rotate(150) scale(0.99, 0.97)"/>
      <use href="#${uid}-wide" transform="rotate(180) scale(0.96, 0.94)"/>
      <use href="#${uid}-wide" transform="rotate(210) scale(0.98, 0.96)"/>
      <use href="#${uid}-wide" transform="rotate(240) scale(0.99, 1)"/>
      <use href="#${uid}-wide" transform="rotate(270) scale(0.97, 0.98)"/>
      <use href="#${uid}-wide" transform="rotate(300) scale(1.05, 1.08)"/>
      <use href="#${uid}-wide" transform="rotate(330) scale(1.06, 1.07)"/>
    </g>
    <g transform="rotate(15)">
      <use href="#${uid}-mid-petal" transform="rotate(0) scale(1.04, 1.05)"/>
      <use href="#${uid}-mid-petal" transform="rotate(30) scale(1.01, 1.03)"/>
      <use href="#${uid}-mid-petal" transform="rotate(60) scale(1.02, 1.01)"/>
      <use href="#${uid}-mid-petal" transform="rotate(90)"/>
      <use href="#${uid}-mid-petal" transform="rotate(120)"/>
      <use href="#${uid}-mid-petal" transform="rotate(150)"/>
      <use href="#${uid}-mid-petal" transform="rotate(180) scale(0.97, 0.96)"/>
      <use href="#${uid}-mid-petal" transform="rotate(210)"/>
      <use href="#${uid}-mid-petal" transform="rotate(240)"/>
      <use href="#${uid}-mid-petal" transform="rotate(270)"/>
      <use href="#${uid}-mid-petal" transform="rotate(300) scale(1.03, 1.04)"/>
      <use href="#${uid}-mid-petal" transform="rotate(330) scale(1.03, 1.04)"/>
    </g>
    <g>
      <use href="#${uid}-thin" transform="rotate(0)"/>
      <use href="#${uid}-thin" transform="rotate(30)"/>
      <use href="#${uid}-thin" transform="rotate(60)"/>
      <use href="#${uid}-thin" transform="rotate(90)"/>
      <use href="#${uid}-thin" transform="rotate(120)"/>
      <use href="#${uid}-thin" transform="rotate(150)"/>
      <use href="#${uid}-thin" transform="rotate(180)"/>
      <use href="#${uid}-thin" transform="rotate(210)"/>
      <use href="#${uid}-thin" transform="rotate(240)"/>
      <use href="#${uid}-thin" transform="rotate(270)"/>
      <use href="#${uid}-thin" transform="rotate(300)"/>
      <use href="#${uid}-thin" transform="rotate(330)"/>
    </g>
    <circle cx="0" cy="0" r="12" fill="url(#${uid}-center)"/>
    <ellipse cx="-4" cy="-4" rx="4" ry="2" fill="#ffffff" transform="rotate(-30 -4 -4)"/>
  </g>
</svg>`;
  }

  function createBurstPieces(lotus) {
    for (let i = 0; i < PETAL_BURST_COUNT; i += 1) {
      const piece = document.createElement("span");
      piece.className = "lotus-burst-piece";
      const angle = random(0, Math.PI * 2);
      const distance = random(42, 138);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - random(10, 34);
      piece.style.setProperty("--dx", `${dx.toFixed(2)}px`);
      piece.style.setProperty("--dy", `${dy.toFixed(2)}px`);
      piece.style.setProperty("--rot", `${random(-260, 260).toFixed(0)}deg`);
      piece.style.setProperty("--dur", `${random(0.85, 1.45).toFixed(2)}s`);
      piece.style.setProperty("--delay", `${random(0, 0.22).toFixed(2)}s`);
      piece.style.setProperty("--end-scale", `${random(1.05, 1.95).toFixed(2)}`);
      piece.style.setProperty("--lift", `${random(7, 22).toFixed(2)}px`);
      lotus.appendChild(piece);
    }
  }

  function createLotus() {
    const lotus = document.createElement("button");
    lotus.className = "lotus-bg__item";
    lotus.type = "button";
    lotus.setAttribute("aria-label", "Лотос");
    const pos = pickEdgePosition();
    lotus.style.left = `${pos.left}%`;
    lotus.style.top = `${pos.top}%`;
    lotus.style.setProperty("--lotus-size", `${random(34, 68)}px`);
    lotus.style.setProperty("--appear-delay", `${random(0, 8).toFixed(1)}s`);
    lotus.style.setProperty("--sway-dur", `${random(3.5, 7).toFixed(1)}s`);
    lotus.style.setProperty("--sway-x", `${random(-6, 6).toFixed(1)}px`);
    lotus.style.setProperty("--sway-y", `${random(-5, 5).toFixed(1)}px`);
    lotus.style.setProperty("--rot-delta", `${random(-4, 4).toFixed(1)}deg`);
    lotus.style.setProperty("--float-x", "0px");
    lotus.style.setProperty("--float-y", "0px");
    lotus.style.setProperty("--float-rot", "0deg");

    const z = Math.round(random(0, 3));
    lotus.style.zIndex = String(z);
    const maxOpacity = clamp(0.15 + z * 0.03 + random(0, 0.04), 0.14, 0.28);
    lotus.style.setProperty("--lotus-opacity", maxOpacity.toFixed(2));

    lotus.innerHTML = `
      <span class="lotus-flower">${buildLotusSvg(lotusUid())}</span>
      <span class="lotus-wave"></span>
    `;

    createBurstPieces(lotus);

    lotus.addEventListener("click", (event) => {
      event.preventDefault();
      lotus.classList.remove("burst");
      void lotus.offsetWidth;
      lotus.classList.add("burst");
      lotus.classList.add("vanish");

      const rect = lotus.getBoundingClientRect();
      const pageX = rect.left + rect.width / 2 + window.scrollX;
      const pageY = rect.top + rect.height / 2 + window.scrollY;
      triggerBackgroundWave(pageX, pageY);
      impactNearbyElements(pageX, pageY);
      showLotusQuote(pageX, pageY);
    });

    return lotus;
  }

  function startChaoticFloat(layer) {
    const lotuses = Array.from(layer.querySelectorAll(".lotus-bg__item"));
    if (!lotuses.length) return;

    const states = lotuses.map((lotus) => ({
      lotus,
      x: random(-8, 8),
      y: random(-8, 8),
      vx: random(-0.22, 0.22),
      vy: random(-0.22, 0.22),
      rot: random(-2, 2),
      vRot: random(-0.055, 0.055),
      ampX: random(7, 18),
      ampY: random(7, 18),
      drift: random(0.75, 1.45),
      noisePhaseX: random(0, Math.PI * 2),
      noisePhaseY: random(0, Math.PI * 2),
      noiseSpeedX: random(0.0012, 0.0027),
      noiseSpeedY: random(0.001, 0.0024),
      maxX: random(14, 28),
      maxY: random(12, 26),
      maxRot: random(4.8, 9.8),
    }));

    let lastTs = performance.now();
    window.setInterval(() => {
      const now = performance.now();
      const dtMs = Math.min(80, now - lastTs);
      lastTs = now;
      const dt = dtMs / 16.6667;

      states.forEach((state) => {
        if (state.lotus.classList.contains("vanish")) return;

        state.vx += random(-0.036, 0.036) * state.drift;
        state.vy += random(-0.036, 0.036) * state.drift;
        state.vRot += random(-0.008, 0.008);

        state.vx *= 0.94;
        state.vy *= 0.94;
        state.vRot *= 0.91;

        state.x += state.vx * dt;
        state.y += state.vy * dt;
        state.rot += state.vRot * dt;

        if (Math.abs(state.x) > state.maxX) state.vx += state.x > 0 ? -0.16 : 0.16;
        if (Math.abs(state.y) > state.maxY) state.vy += state.y > 0 ? -0.16 : 0.16;
        if (Math.abs(state.rot) > state.maxRot) state.vRot += state.rot > 0 ? -0.06 : 0.06;

        const noiseX = Math.sin(now * state.noiseSpeedX + state.noisePhaseX) * state.ampX;
        const noiseY = Math.cos(now * state.noiseSpeedY + state.noisePhaseY) * state.ampY;
        const finalX = clamp(state.x + noiseX * 0.36, -state.maxX, state.maxX);
        const finalY = clamp(state.y + noiseY * 0.36, -state.maxY, state.maxY);
        const finalRot = clamp(state.rot + (noiseX - noiseY) * 0.095, -state.maxRot, state.maxRot);

        state.lotus.style.setProperty("--float-x", `${finalX.toFixed(2)}px`);
        state.lotus.style.setProperty("--float-y", `${finalY.toFixed(2)}px`);
        state.lotus.style.setProperty("--float-rot", `${finalRot.toFixed(2)}deg`);
      });
    }, FLOAT_TICK_MS);
  }

  function syncLayerHeight(layer) {
    const doc = document.documentElement;
    const body = document.body;
    const maxHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      doc.clientHeight,
      doc.scrollHeight,
      doc.offsetHeight
    );
    layer.style.height = `${maxHeight}px`;
  }

  let wavePulseRoot;
  let lotusQuoteRoot;
  let lastQuoteIndex = -1;

  function getWavePulseRoot() {
    if (wavePulseRoot) return wavePulseRoot;
    wavePulseRoot = document.createElement("div");
    wavePulseRoot.className = "lotus-bg-wave-pulse";
    wavePulseRoot.setAttribute("aria-hidden", "true");
    document.body.insertBefore(wavePulseRoot, document.body.firstChild);
    return wavePulseRoot;
  }

  function getLotusQuoteRoot() {
    if (lotusQuoteRoot) return lotusQuoteRoot;
    lotusQuoteRoot = document.createElement("div");
    lotusQuoteRoot.className = "lotus-quote-layer";
    lotusQuoteRoot.setAttribute("aria-hidden", "true");
    document.body.insertBefore(lotusQuoteRoot, document.body.firstChild);
    return lotusQuoteRoot;
  }

  function getDocumentHeight() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      doc.clientHeight,
      doc.scrollHeight,
      doc.offsetHeight
    );
  }

  function pickQuoteText() {
    if (LOTUS_QUOTES.length < 2) return LOTUS_QUOTES[0] || "";
    let idx = Math.floor(random(0, LOTUS_QUOTES.length));
    if (idx === lastQuoteIndex) idx = (idx + 1) % LOTUS_QUOTES.length;
    lastQuoteIndex = idx;
    return LOTUS_QUOTES[idx];
  }

  function showLotusQuote(pageX, pageY) {
    const root = getLotusQuoteRoot();
    const quote = document.createElement("div");
    quote.className = "lotus-quote";
    quote.textContent = pickQuoteText();

    const documentHeight = getDocumentHeight();
    root.style.height = `${documentHeight}px`;

    // First render quote, then clamp by its real dimensions.
    quote.style.left = `${pageX.toFixed(1)}px`;
    quote.style.top = `${(pageY - 88).toFixed(1)}px`;
    quote.style.visibility = "hidden";

    root.appendChild(quote);
    const rect = quote.getBoundingClientRect();
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const viewportLeft = window.scrollX;
    const viewportRight = window.scrollX + document.documentElement.clientWidth;
    const padding = 14;
    const x = clamp(pageX, viewportLeft + halfW + padding, viewportRight - halfW - padding);
    const y = clamp(pageY - 88, halfH + padding, documentHeight - halfH - padding);

    quote.style.left = `${x.toFixed(1)}px`;
    quote.style.top = `${y.toFixed(1)}px`;
    quote.style.visibility = "visible";

    window.setTimeout(() => quote.remove(), 6200);
  }

  function triggerBackgroundWave(pageX, pageY) {
    const el = getWavePulseRoot();
    const vx = ((pageX - window.scrollX) / Math.max(1, window.innerWidth)) * 100;
    const vy = ((pageY - window.scrollY) / Math.max(1, window.innerHeight)) * 100;
    el.style.setProperty("--wave-vx", `${vx.toFixed(2)}%`);
    el.style.setProperty("--wave-vy", `${vy.toFixed(2)}%`);
    el.classList.remove("lotus-bg-wave-pulse--on");
    void el.offsetWidth;
    el.classList.add("lotus-bg-wave-pulse--on");
    window.setTimeout(() => el.classList.remove("lotus-bg-wave-pulse--on"), 2600);
  }

  function waveFrontDelayMs(distance) {
    if (distance <= WAVE_START_RADIUS_PX) return 0;
    if (distance >= WAVE_MAX_RADIUS_PX) return GLOBAL_WAVE_DURATION_MS;
    const span = WAVE_MAX_RADIUS_PX - WAVE_START_RADIUS_PX;
    return ((distance - WAVE_START_RADIUS_PX) / span) * GLOBAL_WAVE_DURATION_MS;
  }

  function impactNearbyElements(pageX, pageY) {
    const targets = document.querySelectorAll(
      "h1,h2,h3,h4,p,li,a,.card,.tradition-card,.kalm-card-item,.media-card,.audio-track,.content-card,.info-pill,.quote-card,button"
    );
    targets.forEach((el) => {
      if (el.closest(".lotus-bg")) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 + window.scrollX;
      const cy = rect.top + rect.height / 2 + window.scrollY;
      const dx = cx - pageX;
      const dy = cy - pageY;
      const distance = Math.hypot(dx, dy);
      if (distance > WAVE_MAX_RADIUS_PX) return;

      const power = 1 - distance / WAVE_MAX_RADIUS_PX;
      const shift = power * 14;
      const nx = distance === 0 ? 0 : dx / distance;
      const ny = distance === 0 ? 0 : dy / distance;

      const delay = waveFrontDelayMs(distance);
      window.setTimeout(() => {
        el.style.setProperty("--wave-x", `${(nx * shift).toFixed(2)}px`);
        el.style.setProperty("--wave-y", `${(ny * shift).toFixed(2)}px`);
        el.style.setProperty("--wave-power", power.toFixed(3));
        el.classList.remove("lotus-wave-hit");
        void el.offsetWidth;
        el.classList.add("lotus-wave-hit");
        window.setTimeout(() => el.classList.remove("lotus-wave-hit"), WAVE_HIT_ANIM_MS);
      }, delay);
    });
  }

  function initLotusBackground() {
    document.getElementById("lotus-wave-filter-svg")?.remove();
    getWavePulseRoot();
    getLotusQuoteRoot();

    const layer = document.createElement("div");
    layer.className = "lotus-bg";
    layer.setAttribute("aria-hidden", "true");

    for (let i = 0; i < LOTUS_COUNT; i += 1) {
      layer.appendChild(createLotus());
    }

    document.body.appendChild(layer);
    syncLayerHeight(layer);
    startChaoticFloat(layer);
    window.addEventListener("resize", () => syncLayerHeight(layer));
    window.addEventListener("load", () => syncLayerHeight(layer));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLotusBackground, { once: true });
  } else {
    initLotusBackground();
  }
})();

