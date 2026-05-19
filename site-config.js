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
