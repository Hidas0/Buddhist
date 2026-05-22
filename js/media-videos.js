/**
 * media-videos.js — ссылки на видео в облаке (каталог на video-player.html).
 * У каждого ролика одно поле: url (полная ссылка на .mp4).
 */
(() => {
  function getVideoUrl(video) {
    return String(video?.url || "").trim();
  }

  function getCategoryById(catalog, id) {
    if (!catalog?.categories) return null;
    return catalog.categories.find((c) => c.id === id) || null;
  }

  window.DHARMA_MEDIA = {
    getVideoUrl,
    getCategoryById,
  };
})();
