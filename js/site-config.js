/**
 * site-config.js — базовый URL сайта для заголовка HTTP-Referer в запросах OpenRouter.
 * GitHub Pages: https://hidas0.github.io/Buddhist
 * Локально: текущий origin (Live Server и т.п.).
 */
(() => {
  const host = window.location.hostname; // например hidas0.github.io или localhost
  const path = window.location.pathname; // путь, напр. /Buddhist/index.html

  // Продакшен на GitHub Pages в подпапке репозитория
  if (host.endsWith('github.io') && path.startsWith('/Buddhist')) {
    window.DHARMA_SITE_ORIGIN = 'https://hidas0.github.io/Buddhist';
    return;
  }

  // Локальный или другой хост по http/https
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    window.DHARMA_SITE_ORIGIN = window.location.origin.replace(/\/$/, ''); // без слэша в конце
  }
})();
