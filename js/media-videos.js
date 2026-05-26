/**
 * media-videos.js — вспомогательные функции для видеотеки (video-player.html).
 * Каталог роликов задаётся в HTML: window.DHARMA_VIDEO_CATALOG.
 */
(() => {

  /** Взять URL ролика из объекта { url: "https://..." } */
  function getVideoUrl(video) {
    return String(video?.url || "").trim();
  }

  /** Найти категорию плейлиста по id в каталоге */
  function getCategoryById(catalog, id) {
    if (!catalog?.categories) return null;
    return catalog.categories.find((c) => c.id === id) || null;
  }

  // API для video-player-page.js
  window.DHARMA_MEDIA = {
    getVideoUrl,
    getCategoryById,
  };
})();
