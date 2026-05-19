# Путь Дхармы

Статический сайт о буддийских традициях: каталог, карта, медиатека, аудиогид, видеоплеер.

## Медиафайлы

- **Изображения** — папка `images/` (в репозитории).
- **Видео и аудио** — прямые ссылки на Object Storage (Яндекс Облако) в `video-player.html` и `audio.html`. Локальные `.mp4`/`.mp3` в `video/` и `audio/` при необходимости тоже поддерживаются.

## AI-чат (OpenRouter)

1. Скопируйте `config.local.js.example` → `config.local.js`
2. Вставьте ключ с [openrouter.ai](https://openrouter.ai)
3. На страницах перед `ai-chatbot.js` подключён `config.local.js` (если файла нет — чат покажет подсказку)

**Важно:** не коммитьте `config.local.js` в Git — только `config.local.js.example` без реального ключа.

## Сайт в интернете (GitHub Pages)

После push в `main` сайт публикуется автоматически.

**Адрес:** https://hidas0.github.io/Buddhist/

Первый раз включите Pages на GitHub:

1. Репозиторий **Buddhist** → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Подождите 2–5 минут после push (вкладка **Actions** → зелёная галочка)

### AI-чат на опубликованном сайте

Локальный `config.local.js` на GitHub не попадает. Чтобы чат работал онлайн:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Имя: `OPENROUTER_API_KEY`, значение: ваш ключ `sk-or-v1-...`
3. **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow** (пересборка)

## Запуск локально

Откройте `index.html` через локальный сервер (Live Server, `npx serve` и т.п.), не как `file://`.
