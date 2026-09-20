# Сайт trip-track.app: SEO, презентация, вход через Apple и «Мои поездки»

**Дата:** 20 сентября 2026. **Статус:** решения приняты сессией по поручению
владельца («сделай большую работу, я не за ПК»); спорить с ними можно цифрой.

## 1. Цель
Сайт работает на продвижение: находится в поиске по запросам про трекер
поездок / дневник дорог / альтернативу Google Timeline (ru + en), убедительно
показывает приложение и ведёт в App Store. Плюс первая «полезная» функция для
своих: войти через Apple и посмотреть свои поездки на карте (только свои).

## 2. Что мешает сейчас
SPA на Vite без пререндера: поисковик получает пустой `<div id="root">`, один
`<title>` на все страницы, язык переключается `?lang=`/localStorage — у
русской версии нет своего URL, нет `hreflang`, sitemap на 7 адресов без
языков, JSON-LD с выдуманным `aggregateRating` (ratingCount 2). Контент —
три блока и одна цитата.

## 3. Решения
- **Пререндер в статический HTML на сборке** (react-router `createStaticHandler`
  + `renderToString`, без браузера), по маршруту и языку: `/…` (en) и
  `/ru/…`. Каждая страница — свои `<title>`, `description`, canonical,
  `og:*`, `twitter:*`, `hreflang` (en, ru, x-default), `<html lang>`. После
  гидрации всё работает как SPA. nginx: `try_files $uri $uri/index.html
  /index.html`, настоящий 404 (`error_page 404 /404.html`), `immutable` для
  `/assets/`.
- **Языки — в пути**, `?lang=` и localStorage остаются как совместимость и
  редирект на префикс. Переключатель языка меняет путь.
- **JSON-LD честный**: `SoftwareApplication` без `aggregateRating` (появится,
  когда будет реальный счётчик из App Store), `Organization`, `FAQPage` на
  блок FAQ, `BreadcrumbList` на внутренних страницах.
- **Контент под запросы**: главная (герой, «как это работает», атлас-туман,
  места, путешествия, приватность, FAQ, CTA), страницы `features`,
  `google-timeline-alternative`, `fog-of-war-map` — усилить текстом и
  скриншотами (WebP уже есть); новые: `privacy` (политика, нужна и для App
  Store), `press` не делаем.
- **Вход через Apple на сайте**: Apple JS SDK (`usePopup`), `id_token` →
  `POST /auth/login {identityToken, localUserId, deviceName: "web", nonce}` —
  тот же контракт, что у приложения; аудитория — Services ID, который
  владелец добавляет в `APPLE_BUNDLE_ID` через запятую (код бэкенда уже умеет
  список). Бэкенд получает CORS для `https://trip-track.app`.
- **«Мои поездки»** — раздел `/app` (noindex, вне sitemap, `Disallow: /app`
  в robots): список поездок (`POST /trips/list`), карточка с превью маршрута
  (декод `previewPolyline` тем же форматом, что `public/polyline.util.ts` на
  сервере), экран поездки с полным треком на MapLibre (`POST /trips/detail`),
  выход. Только свои данные, ничего публичного нового.

## 4. Что нужно от владельца (после мержа)
1. Apple Developer → Identifiers → Services ID (например `app.trip-track.web`),
   Sign in with Apple включён, привязан к App ID `com.onezee.TripTrack`,
   домен `trip-track.app`, Return URL `https://trip-track.app/app/login`.
2. Прод бэкенда: `APPLE_BUNDLE_ID=com.onezee.TripTrack,app.trip-track.web`.
3. Деплой бэкенда (CORS) и сайта.
