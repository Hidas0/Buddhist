/**
 * video-player-page.js — страница video-player.html.
 * Читает ?category= и ?title=, строит сетку карточек из window.DHARMA_VIDEO_CATALOG.
 */
(async () => {
  const { getVideoUrl, getCategoryById } = window.DHARMA_MEDIA || {};

  if (!getVideoUrl) {
    console.error("media-videos.js не подключён");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("category") || "monastery"; // id категории из media.html
  const titleParam = urlParams.get("title"); // опциональный заголовок из URL
  const catalog = window.DHARMA_VIDEO_CATALOG; // объект в <script> на странице
  const category =
    getCategoryById(catalog, categoryId) || catalog?.categories?.[0];
  const videos = (category?.videos || []).filter((v) => getVideoUrl(v)); // только с url

  const titleEl = document.getElementById("categoryTitle");
  const container = document.getElementById("videosContainer");
  const errorMessage = document.getElementById("errorMessage");

  if (titleEl) {
    titleEl.textContent = titleParam
      ? decodeURIComponent(titleParam.replace(/\+/g, " "))
      : category?.title || "Медиатека";
  }

  /** Экранирование текста для вставки в innerHTML */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Открыть модальное окно с HTML5 video */
  function playVideo(src) {
    const modal = document.getElementById("videoModal");
    const video = document.getElementById("html5Player");
    if (!modal || !video) return;

    video.src = src;
    video.load();
    modal.classList.add("active");
    document.body.classList.add("video-modal-open");
    video.play().catch(() => {}); // autoplay может быть заблокирован
  }

  window.closeVideo = function closeVideo() {
    const modal = document.getElementById("videoModal");
    const video = document.getElementById("html5Player");
    if (video) {
      video.pause();
      video.removeAttribute("src");
    }
    if (modal) modal.classList.remove("active");
    document.body.classList.remove("video-modal-open");
  };

  if (!container) return;

  if (!videos.length) {
    container.innerHTML =
      '<p class="muted">В этой категории пока нет загруженных видео. Добавьте ссылку <code>url</code> в каталог <code>video-player.html</code> (блок <code>DHARMA_VIDEO_CATALOG</code>).</p>';
    return;
  }

  videos.forEach((video, index) => {
    const src = getVideoUrl(video);
    const poster =
      video.thumbnail && !/\.mp4$/i.test(video.thumbnail)
        ? video.thumbnail
        : category?.thumb || "images/monks.png";
    const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";

    const card = document.createElement("div");
    card.className = "media-card animate-slide-up";
    card.style.animationDelay = `${0.1 + index * 0.08}s`;
    card.style.cursor = "pointer";
    card.onclick = () => playVideo(src);

    card.innerHTML = `
      <div class="video-thumb">
        <video class="video-thumb__preview" src="${escapeHtml(src)}"${posterAttr} muted playsinline preload="metadata"></video>
        <i data-lucide="play" class="play-icon"></i>
      </div>
      <div class="media-info">
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.description || "")}</p>
      </div>
    `;
    container.appendChild(card);
  });

  // Превью: кадр с начала ролика; при ошибке загрузки скрыть video
  container.querySelectorAll(".video-thumb__preview").forEach((el) => {
    el.addEventListener("loadedmetadata", () => {
      if (el.currentTime < 0.5) {
        el.currentTime = Math.min(1, (el.duration || 2) * 0.05);
      }
    });
    el.addEventListener("error", () => {
      el.style.display = "none";
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeVideo();
  });

  const modal = document.getElementById("videoModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) window.closeVideo(); // клик по затемнению
    });
  }

  if (window.lucide) window.lucide.createIcons();
})();
