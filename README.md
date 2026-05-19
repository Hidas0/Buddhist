# Путь Дхармы

Статический сайт о буддийских традициях: каталог, карта, медиатека, аудиогид, видеоплеер.

## Медиафайлы

- **Изображения** — папка `images/` (в репозитории).
- **Видео и аудио** — прямые ссылки на Object Storage (Яндекс Облако) в `video-player.html` и `audio.html`. Локальные `.mp4`/`.mp3` в `video/` и `audio/` при необходимости тоже поддерживаются.

## AI-чат (OpenRouter)

1. Скопируйте `js/config.local.js.example` → `js/config.local.js`
2. Вставьте ключ с [openrouter.ai](https://openrouter.ai)
3. На страницах подключены скрипты из папки `js/` (если `config.local.js` нет — чат покажет подсказку)

**Важно:** не коммитьте `js/config.local.js` в Git — только `js/config.local.js.example` без реального ключа.

## Структура проекта

- `css/` — стили (`style.css`)
- `js/` — скрипты сайта и чата
- `images/` — картинки
- `data/` — данные (карта)
- `presentation/` — слайды для защиты/демонстрации ([открыть](presentation/index.html))

## Презентация с скриншотами

Папка **`presentation/`**: HTML-слайды с местами под скрины каждого раздела.  
Инструкция: [presentation/КАК-СДЕЛАТЬ-СКРИНЫ.md](presentation/КАК-СДЕЛАТЬ-СКРИНЫ.md)  
Онлайн: https://hidas0.github.io/Buddhist/presentation/

## Сайт в интернете (GitHub Pages)

После push в `main` сайт публикуется автоматически.

**Адрес сайта:** https://hidas0.github.io/Buddhist/

Первый раз включите Pages на GitHub:

1. Репозиторий **Buddhist** → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Если в поле **Custom domain** указан `put-dharmy.com` — нажмите **Remove** (оставьте только адрес `hidas0.github.io`)
4. Подождите 2–5 минут после push (вкладка **Actions** → зелёная галочка)

### AI-чат на опубликованном сайте

Локальный `config.local.js` на GitHub не попадает. Чтобы чат работал онлайн:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Имя: `OPENROUTER_API_KEY`, значение: ваш ключ `sk-or-v1-...`
3. **Actions** → workflow **Deploy to GitHub Pages** → **Run workflow** (пересборка)

## Запуск локально

Откройте `index.html` через локальный сервер (Live Server, `npx serve` и т.п.), не как `file://`.
