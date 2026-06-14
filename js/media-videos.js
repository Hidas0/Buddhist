/**
 * media-videos.js — каталог видео (video-player.html) и resolve URL.
 * source: "youtube" | "cloud" | "url" | "local"
 */
(() => {
  const DEFAULT_BUCKET = "https://storage.yandexcloud.net/diplom11";

  function encodeObjectKey(...segments) {
    return segments
      .filter(Boolean)
      .map((part) => encodeURIComponent(String(part).trim()))
      .join("/");
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function isLocalMp4(value) {
    return /\.mp4$/i.test(String(value || "")) && !isHttpUrl(value);
  }

  function buildCloudVideoUrl(folder, fileName, bucket) {
    const base = (bucket || DEFAULT_BUCKET).replace(/\/$/, "");
    if (!folder || !fileName) return "";
    return `${base}/${encodeObjectKey(folder, fileName)}`;
  }

  /** Путь video/Папка/файл.mp4 из облачной ссылки или cloudFile */
  function cloudUrlToLocalVideoPath(cloudUrl, categoryFolder) {
    const raw = String(cloudUrl || "").trim();
    if (!raw) return "";
    try {
      const parts = decodeURIComponent(new URL(raw).pathname)
        .split("/")
        .filter(Boolean);
      if (parts.length < 2) return "";
      const file = parts[parts.length - 1];
      const folder = categoryFolder || decodeURIComponent(parts[parts.length - 2]);
      return `video/${encodeObjectKey(folder, file)}`;
    } catch (e) {
      return "";
    }
  }

  /**
   * Возвращает { type: "youtube"|"html5"|"none", src?, id? }
   */
  function resolveVideoPlayback(entry, category) {
    if (!entry) return { type: "none" };

    const source = String(entry.source || "").toLowerCase();
    const bucket = window.DHARMA_VIDEO_BUCKET || DEFAULT_BUCKET;
    const folder = entry.cloudFolder || category?.cloudFolder || "";
    const file = entry.cloudFile || "";
    const url = String(entry.url || "").trim();
    const youtubeId = String(entry.youtubeId || "").trim();
    const localFile = String(entry.localFile || "").trim();

    if (source === "youtube" && youtubeId) {
      return { type: "youtube", id: youtubeId };
    }

    if (source === "local" && localFile) {
      const localPath = folder
        ? `video/${encodeObjectKey(folder, localFile)}`
        : `video/${encodeURIComponent(localFile)}`;
      return { type: "html5", src: localPath };
    }

    if (source === "url" || isHttpUrl(url)) {
      if (url) {
        const localFromCloud = cloudUrlToLocalVideoPath(url, folder);
        if (localFromCloud) {
          return { type: "html5", src: localFromCloud, cloudSrc: url, youtubeId };
        }
        return { type: "html5", src: url, youtubeId };
      }
    }

    if (source === "cloud" && file) {
      const cloudUrl = buildCloudVideoUrl(folder, file, bucket);
      const localPath = `video/${encodeObjectKey(folder, file)}`;
      return { type: "html5", src: localPath, cloudSrc: cloudUrl, youtubeId };
    }

    if (isLocalMp4(entry.videoId)) {
      const path = folder
        ? `video/${encodeObjectKey(folder, entry.videoId)}`
        : `video/${encodeURIComponent(entry.videoId)}`;
      return { type: "html5", src: path, youtubeId };
    }

    if (youtubeId && !isHttpUrl(youtubeId) && !isLocalMp4(youtubeId)) {
      return { type: "youtube", id: youtubeId };
    }

    if (url) {
      const localFromCloud = cloudUrlToLocalVideoPath(url, folder);
      return {
        type: "html5",
        src: localFromCloud || url,
        cloudSrc: isHttpUrl(url) ? url : "",
        youtubeId,
      };
    }

    if (file && folder) {
      const cloudUrl = buildCloudVideoUrl(folder, file, bucket);
      return {
        type: "html5",
        src: `video/${encodeObjectKey(folder, file)}`,
        cloudSrc: cloudUrl,
        youtubeId,
      };
    }

    return { type: "none" };
  }

  function youtubeThumb(id) {
    return `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
  }

  function getVideoThumbnail(entry, category, playback) {
    if (entry.thumbnail) return entry.thumbnail;
    const pb = playback || resolveVideoPlayback(entry, category);
    if (pb.type === "youtube" && pb.id) return youtubeThumb(pb.id);
    return category?.thumb || "images/monks.png";
  }

  function getCategoryById(catalog, id) {
    if (!catalog?.categories) return null;
    return catalog.categories.find((c) => c.id === id) || null;
  }

  window.DHARMA_MEDIA = {
    DEFAULT_BUCKET,
    buildCloudVideoUrl,
    resolveVideoPlayback,
    getVideoThumbnail,
    getCategoryById,
    isHttpUrl,
  };
})();
