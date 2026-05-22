/**
 * site-config.js — базовый origin сайта для заголовков OpenRouter (HTTP-Referer).
 * На GitHub Pages: https://hidas0.github.io/Buddhist
 * Локально: текущий origin (Live Server и т.п.).
 */
(() => {
  const host = window.location.hostname;
  const path = window.location.pathname;

  if (host.endsWith('github.io') && path.startsWith('/Buddhist')) {
    window.DHARMA_SITE_ORIGIN = 'https://hidas0.github.io/Buddhist';
    return;
  }

  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    window.DHARMA_SITE_ORIGIN = window.location.origin.replace(/\/$/, '');
  }
})();
