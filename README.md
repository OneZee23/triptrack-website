# TripTrack Website

Сайт TripTrack и личный кабинет поездок: [trip-track.app](https://trip-track.app)

Статический SSR-сайт на React, собирается в статику на этапе сборки (prerender),
раздаётся nginx из Docker. Отдельного бэкенда у сайта нет: всё, что нужно приложению,
живёт в отдельном репозитории `trip-track-backend`.

## Стек

- **React 19** + **TypeScript**, роутинг на `react-router` 7
- **Vite 8** — сборка, SSR-бандл и дев-сервер
- **Tailwind 4** — стили
- **MapLibre GL** — интерактивные карты (туман войны, демо треков)
- **Motion** — анимации
- **Vitest** + Testing Library — тесты
- **Umami** — своя аналитика, self-hosted рядом в docker-compose

## Страницы

| Путь | Файл | Что там |
|---|---|---|
| `/` | `src/pages/Home.tsx` | лендинг |
| `/features` | `Features.tsx` | возможности приложения |
| `/download` | `Download.tsx` | ссылки на сторы |
| `/fog-of-war-map` | `FogOfWarMap.tsx` | посадочная под запрос «карта-туман» |
| `/google-timeline-alternative` | `GoogleTimeline.tsx` | посадочная обзор отличий от Google Timeline |
| `/roadmap` | `Roadmap.tsx` | актуальная доступность и планы |
| `/about` | `About.tsx` | о проекте |
| `/privacy` | `Privacy.tsx` | политика конфиденциальности |
| `/app/login` | `src/app/LoginPage.tsx` | вход через Apple |
| `/app/trips` | `src/app/TripsPage.tsx` | личные поездки, поиск, фильтры, большая карта |
| `/app/trips/new` | `src/app/ManualTripPage.tsx` | редактор ручной поездки с PRO; пока закрыт серверным флагом |
| `/app/trips/:id` | `src/app/TripPage.tsx` | маршрут и сведения о поездке |
| — | `NotFound.tsx` | 404 |

У страниц есть русские адреса с префиксом `/ru`. Личный кабинет требует
авторизацию, не индексируется и не отправляет просмотры в аналитику.

Две страницы (`fog-of-war-map`, `google-timeline-alternative`) сделаны под поисковые запросы,
а не под навигацию по сайту. Это SEO-вход, и правки там надо согласовывать
с текстами в `docs/content-prompt.md`.

## Сборка

```bash
npm install
npm run dev            # дев-сервер Vite
npm run build          # tsc + клиент + SSR-бандл + prerender
npm run preview        # посмотреть собранное
npm run test           # vitest
npm run lint           # eslint
npm run check:seo      # проверка метатегов и структуры страниц
```

`build` состоит из четырёх шагов: проверка типов, клиентский бандл,
SSR-бандл в `dist-server`, затем `scripts/prerender.mjs` прогоняет роуты
через SSR и раскладывает готовый HTML в `dist`. В продакшен уезжает `dist`.

## Переменные окружения

Смотри `.env.example`. Для локальной разработки публичные настройки сборки
можно задать в `.env.local`:

```
VITE_API_BASE_URL=https://api.trip-track.app
VITE_APPLE_SERVICES_ID=app.trip-track.web
```

Это значения по умолчанию. Для локального API обязательно поменять URL:
без этого запросы идут в production. Apple принимает вход только с
зарегистрированного HTTPS Return URL; localhost для реального входа не подходит.
Docker использует production-значения по умолчанию, `.env*` в его слои не копируются.

Для Umami в Docker Compose:

```
UMAMI_DB_PASSWORD=
UMAMI_SECRET=
```

Генерация: `openssl rand -hex 32`

## Деплой

Полная инструкция: [DEPLOY.md](DEPLOY.md)

Коротко: дроплет DigitalOcean на Ubuntu 24.04, Docker Compose поднимает nginx
с собранной статикой плюс Umami с Postgres. Домен за Cloudflare.
Автодеплой через GitHub Actions — `.github/workflows/deploy.yml`.

**Состояние на 6 октября 2026:** сайт и кабинет опубликованы; реальный
вход Apple и загрузка основной библиотеки подтверждены владельцем
2 октября. Редактор закрыт серверным флагом до выпуска совместимого iOS
и проверки создания/синхронизации. Версия iOS 0.8.4 одобрена Apple и
ожидает ручного выпуска; одобрение не открывает веб-редактор. Порядок проверки —
[docs/STATE.md](docs/STATE.md). Не включать веб-создание поездок до выпуска
исправления iOS-синхронизации, описанного там.

## Личный кабинет

Вход использует тот же Apple Account, что приложение. Список загружается
страницами, поиск и фильтр дат работают по всей загруженной библиотеке.
Обзорная карта использует облегчённые маршруты, полный трек запрашивается
только для выбранной поездки. Личные данные остаются в памяти вкладки.

В подготовленном, пока закрытом редакторе можно поставить и перемещать точки на карте,
найти адрес, поменять порядок остановок, выбрать дату, длительность и машину.
Сохранение проверяет PRO на сервере; повтор после обрыва связи не создаёт
вторую поездку. Поездка приватная, без GPS-опыта и наград.

Поиск адресов и прокладка по дорогам используют необязательный **серверный**
`WEB_GEOAPIFY_API_KEY` в репозитории API. Не добавлять ключ в `VITE_*`.
При включённом `WEB_MANUAL_TRIPS_ENABLED=true`, но без ключа доступно рисование точками и ввод координат. Настройки API и
проверки лимитов — `trip-track-backend/docs/web-login.md`, разделы 6–7.

Под Node 25 локальный jsdom может конфликтовать с экспериментальным Web Storage:
`NODE_OPTIONS=--no-experimental-webstorage npm test`. В production сборке
используется Node 20 из Dockerfile. Для браузерных тестов нужны вымышленные
данные и перехват всех запросов к API до открытия страницы; реальные токены
из телефона или логов не используются.

## Документация

| Файл | Что |
|---|---|
| `docs/STATE.md` | текущее состояние и порядок выпуска |
| `docs/DECISIONS.md` | решения и ограничения |
| `docs/RELEASES.md` | изменения по выпускам |
| `docs/2026-09-20-site-seo-auth-design.md` | дизайн SEO и авторизации |
| `docs/content-prompt.md` | правила для текстов на сайте |
| `docs/web-app-security.md` | заметки по безопасности |
| `CLAUDE.md` | правила работы для ИИ-ассистентов |

## Связанные репозитории

- `~/OneZeeProjects/trip-track` — само iOS-приложение
- `~/OneZeeProjects/trip-track-backend` — API
- `~/OneZeeProjects/trip-track-observability` — мониторинг
