/**
 * video-player-page.js — страница video-player.html.
 * Читает ?category= и ?title=, строит сетку из window.DHARMA_VIDEO_CATALOG.
 */
(() => {
  const { resolveVideoPlayback, getVideoThumbnail, getCategoryById } =
    window.DHARMA_MEDIA || {};

  if (!resolveVideoPlayback) {
    console.error("media-videos.js не подключён");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("category") || "monastery";
  const titleParam = urlParams.get("title");
  const catalog = window.DHARMA_VIDEO_CATALOG;
  const category =
    getCategoryById(catalog, categoryId) || catalog?.categories?.[0];
  const videos = category?.videos || [];

  const titleEl = document.getElementById("categoryTitle");
  const container = document.getElementById("videosContainer");
  const errorMessage = document.getElementById("errorMessage");

  if (titleEl) {
    titleEl.textContent = titleParam
      ? decodeURIComponent(titleParam.replace(/\+/g, " "))
      : category?.title || "Медиатека";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hideError() {
    if (errorMessage) errorMessage.classList.remove("active");
  }

  function showError() {
    if (errorMessage) errorMessage.classList.add("active");
  }

  function getPlayers() {
    return {
      modal: document.getElementById("videoModal"),
      video: document.getElementById("html5Player"),
      iframe: document.getElementById("youtubePlayer"),
    };
  }

  function stopPlayers() {
    const { video, iframe } = getPlayers();
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.hidden = true;
    }
    if (iframe) {
      iframe.removeAttribute("src");
      iframe.hidden = true;
    }
  }

  function playYoutube(id) {
    const { modal, video, iframe } = getPlayers();
    if (!modal || !iframe) return;

    stopPlayers();
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    iframe.hidden = false;
    modal.classList.add("active");
    document.body.classList.add("video-modal-open");
    hideError();
  }

  function playHtml5(src, fallbackYoutubeId, cloudSrc) {
    const { modal, video, iframe } = getPlayers();
    if (!modal || !video) return;

    stopPlayers();
    iframe.hidden = true;

    const trySrc = (url, isCloud) => {
      video.hidden = false;
      video.src = url;
      video.load();

      const onError = () => {
        video.removeEventListener("error", onError);
        if (!isCloud && cloudSrc && cloudSrc !== url) {
          trySrc(cloudSrc, true);
          return;
        }
        if (fallbackYoutubeId) {
          playYoutube(fallbackYoutubeId);
          return;
        }
        showError();
      };

      video.addEventListener("error", onError, { once: true });
      video.play().catch(() => {});
    };

    trySrc(src, false);
    modal.classList.add("active");
    document.body.classList.add("video-modal-open");
    hideError();
  }

  function playVideo(entry) {
    const playback = resolveVideoPlayback(entry, category);
    if (playback.type === "youtube" && playback.id) {
      playYoutube(playback.id);
      return;
    }
    if (playback.type === "html5" && playback.src) {
      playHtml5(playback.src, playback.youtubeId, playback.cloudSrc);
      return;
    }
    showError();
  }

  window.closeVideo = function closeVideo() {
    const { modal } = getPlayers();
    stopPlayers();
    if (modal) modal.classList.remove("active");
    document.body.classList.remove("video-modal-open");
    hideError();
  };

  if (!container) return;

  const playable = videos.filter((v) => {
    const pb = resolveVideoPlayback(v, category);
    return pb.type !== "none";
  });

  if (!playable.length) {
    container.innerHTML =
      '<p class="muted">В этой категории пока нет роликов. Добавьте <code>youtubeId</code> или <code>url</code> в каталог <code>video-player.html</code>.</p>';
    return;
  }

  playable.forEach((video, index) => {
    const playback = resolveVideoPlayback(video, category);
    const poster = getVideoThumbnail(video, category, playback);
    const card = document.createElement("div");
    card.className = "media-card animate-slide-up";
    card.style.animationDelay = `${0.1 + index * 0.08}s`;
    card.style.cursor = "pointer";
    card.onclick = () => playVideo(video);

    if (playback.type === "youtube") {
      card.innerHTML = `
        <div class="video-thumb" style="background-image:url('${escapeHtml(poster)}');background-size:cover;background-position:center;">
          <i data-lucide="play" class="play-icon"></i>
        </div>
        <div class="media-info">
          <h3>${escapeHtml(video.title)}</h3>
          <p>${escapeHtml(video.description || "")}</p>
        </div>
      `;
    } else {
      const src = playback.cloudSrc || playback.src;
      const posterAttr = poster ? ` poster="${escapeHtml(poster)}"` : "";
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
    }

    container.appendChild(card);
  });

  container.querySelectorAll(".video-thumb__preview").forEach((el) => {
    const card = el.closest(".media-card");
    const entry = playable[Array.from(container.children).indexOf(card)];
    const pb = entry ? resolveVideoPlayback(entry, category) : null;

    el.addEventListener("loadedmetadata", () => {
      if (el.currentTime < 0.5) {
        el.currentTime = Math.min(1, (el.duration || 2) * 0.05);
      }
    });
    el.addEventListener("error", () => {
      if (pb?.type === "html5" && pb.youtubeId) {
        el.style.display = "none";
        const thumb = card?.querySelector(".video-thumb");
        if (thumb && pb.youtubeId) {
          const img = getVideoThumbnail(entry, category, {
            type: "youtube",
            id: pb.youtubeId,
          });
          thumb.style.backgroundImage = `url('${img}')`;
          thumb.style.backgroundSize = "cover";
          thumb.style.backgroundPosition = "center";
        }
      } else {
        el.style.display = "none";
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeVideo();
  });

  const modal = document.getElementById("videoModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) window.closeVideo();
    });
  }

  if (window.lucide) window.lucide.createIcons();
})();
