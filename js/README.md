# Скрипты сайта «Путь Дхармы»

## Порядок подключения (в конце `<body>`)

| Файл | Назначение |
|------|------------|
| `scroll-reveal.js` | `index.html`, `catalog.html` — анимация блоков при прокрутке |
| `catalog.js` | Только `catalog.html` — фильтры, якоря, карточки «Подробнее» |
| `media-videos.js` | Вспомогательные функции для видео (`url` в облаке) |
| `video-player-page.js` | Только `video-player.html` — плейлист из `DHARMA_VIDEO_CATALOG` на странице |
| `dalai-carousel.js` | Только `index.html` — карусель 14 Далай-лам |
| `site-config.js` | Базовый URL для OpenRouter (GitHub Pages `/Buddhist`) |
| `config.local.js` | Ключ `window.DHARMA_OPENROUTER_KEY` (локально; в Git не коммитить) |
| `lotus-bg.js` | Декоративные лотосы, волна, цитаты по клику |
| `site-ui.js` | Мобильное меню (`data-mobile-nav-*`) |
| `back-to-top.js` | Кнопка «Наверх» (`#backTopBtn`) |
| `ai-chatbot.js` | Чат OpenRouter; фокус на традициях и обычаях народов (`CHAT_SYSTEM_PROMPT`) |

**Важно:** `config.local.js` без `defer` — должен идти **перед** `ai-chatbot.js`, чтобы ключ был доступен при отправке сообщения.

На GitHub Pages ключ подставляется в CI из секрета `OPENROUTER_API_KEY` (см. `.github/workflows/pages.yml`).

## Локальная настройка AI

```text
js/config.local.js.example  →  скопировать в  js/config.local.js
```

## Скрипты внутри HTML

- `map.html` — Яндекс.Карты, метки из `data/places.json`
- `audio.html` — плеер мантр, `resolveAudioUrl()` для облака
- `video-player.html` — каталог `window.DHARMA_VIDEO_CATALOG` и плейлисты из облака
- `kalm.html`, `media.html` — фильтры и UI страницы (каталог — в `catalog.js`)

Подробности — в комментариях в начале соответствующих блоков `<script>`.

**Цвета и вёрстка** — в `css/style.css`: блок `:root` и оглавление в шапке файла (какой `--primary`, `--bg` и т.д.).
