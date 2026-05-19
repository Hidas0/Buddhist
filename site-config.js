(() => {
  const host = window.location.hostname;
  const path = window.location.pathname;

  /** Канонический origin для OpenRouter и абсолютных ссылок */
  if (host === 'put-dharmy.com' || host === 'www.put-dharmy.com') {
    window.DHARMA_SITE_ORIGIN = 'https://put-dharmy.com';
    return;
  }

  if (host.endsWith('github.io') && path.startsWith('/Buddhist')) {
    window.DHARMA_SITE_ORIGIN = 'https://hidas0.github.io/Buddhist';
    return;
  }

  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    window.DHARMA_SITE_ORIGIN = window.location.origin.replace(/\/$/, '');
  }
})();
