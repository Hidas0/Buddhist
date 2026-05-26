/**
 * media-page.js — подписи «ПЛЕЙЛИСТ • N ВИДЕО» на media.html.
 * Элементы: [data-playlist-count="monastery|rituals|sacred"].
 */
(() => {
  // Количество роликов в каждой категории (должно совпадать с video-player.html)
  const PLAYLIST_COUNTS = {
    monastery: 5,
    rituals: 4,
    sacred: 4,
  };

  document.querySelectorAll("[data-playlist-count]").forEach((el) => {
    const n = PLAYLIST_COUNTS[el.dataset.playlistCount];
    if (typeof n === "number") {
      el.textContent = `ПЛЕЙЛИСТ • ${n} ВИДЕО`;
    }
  });
})();
