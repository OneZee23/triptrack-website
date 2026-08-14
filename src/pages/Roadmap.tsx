import {
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Zap,
  Watch,
  Cloud,
  Users,
  Search,
  Tag,
  Calendar,
  Car,
  X as XIcon,
  Wrench,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  Gauge,
  Receipt,
  Plane,
  Server,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';

type Status = 'done' | 'current' | 'planned' | 'future';

interface Bilingual {
  en: string;
  ru: string;
}

interface Milestone {
  version: string;
  name?: string;
  date: Bilingual;
  status: Status;
  features: Bilingual[];
  note?: Bilingual;
}

interface Quarter {
  label: Bilingual;
  status: Status;
  milestones: Milestone[];
}

interface BenchItem {
  icon: React.ComponentType<{ className?: string }>;
  title: Bilingual;
  body: Bilingual;
  meta?: Bilingual;
}

interface NotItem {
  icon: React.ComponentType<{ className?: string }>;
  title: Bilingual;
  body: Bilingual;
}

/* -------------------------------------------------------------------------- */
/*  SHIPPED — version history, accurate to commits + memory                   */
/* -------------------------------------------------------------------------- */

const SHIPPED: Quarter[] = [
  {
    label: { en: 'Q1 2026 — Launch', ru: 'Q1 2026 — Старт' },
    status: 'done',
    milestones: [
      {
        version: 'v0.1.0',
        name: 'First Mile',
        date: { en: 'Mar 24', ru: '24 мар' },
        status: 'done',
        features: [
          {
            en: 'GPS recording with speed-coloured routes',
            ru: 'GPS-запись маршрутов с раскраской по скорости',
          },
          {
            en: 'Trip feed grouped by month',
            ru: 'Лента поездок с группировкой по месяцам',
          },
          {
            en: 'Trip detail with elevation, speed graph, route map',
            ru: 'Детали поездки: высота, график скорости, карта маршрута',
          },
          {
            en: 'Multi-vehicle garage with per-car stats',
            ru: 'Гараж с мульти-авто и отдельной статой по каждой',
          },
          {
            en: 'Fog of War exploration map',
            ru: 'Карта тумана войны — закрашиваешь регионы поездками',
          },
          {
            en: '30+ achievement badges & driver levels',
            ru: '30+ ачивок и уровни водителя',
          },
          {
            en: 'Live Activity on the Lock Screen',
            ru: 'Live Activity на экране блокировки',
          },
        ],
      },
      {
        version: 'v0.1.1',
        date: { en: 'Apr 7', ru: '7 апр' },
        status: 'done',
        features: [
          {
            en: 'GPS anomaly filtering (no more teleporting points)',
            ru: 'Фильтр аномалий GPS — больше нет скачков',
          },
          { en: 'Geocoding retries', ru: 'Повтор геокодинга при ошибках' },
          {
            en: 'Better city detection',
            ru: 'Точное определение городов',
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Q2 2026 — Foundation', ru: 'Q2 2026 — Фундамент' },
    status: 'done',
    milestones: [
      {
        version: 'v0.2.0',
        name: 'Fog Cleared',
        date: { en: 'Apr 10', ru: '10 апр' },
        status: 'done',
        features: [
          {
            en: 'Fog of War 2.0 — soft gradients & reveal animations',
            ru: 'Туман войны 2.0 — мягкие градиенты и анимация открытия',
          },
          {
            en: 'Vehicle detail screen with progress',
            ru: 'Экран машины с прогрессом',
          },
          {
            en: 'Temporal fog (the map shows what you knew at trip end)',
            ru: 'Темпоральный туман — карта показывает что было видно на момент поездки',
          },
        ],
      },
      {
        version: 'v0.3.0',
        name: 'Auto Trip',
        date: { en: 'Late Apr', ru: 'Конец апр' },
        status: 'done',
        features: [
          {
            en: 'Auto-detect trip start & stop — no buttons to press',
            ru: 'Автодетект старта и стопа поездки — никаких кнопок',
          },
          {
            en: 'Junk-trip filter (under 500 m AND under 2 min auto-deleted)',
            ru: 'Фильтр мусорных поездок (<500 м и <2 мин — автоудаление)',
          },
          {
            en: 'Force-quit recovery — recording survives app crash',
            ru: 'Восстановление записи после краша приложения',
          },
          {
            en: 'Always-location onboarding & permission flow',
            ru: 'Онбординг с правильным запросом фоновой геолокации',
          },
        ],
      },
      {
        version: 'v0.4.x',
        name: 'Live Activity Wave',
        date: { en: 'Late Apr — Early May', ru: 'Конец апр — нач мая' },
        status: 'done',
        features: [
          {
            en: 'Live Activity auto-starts when a trip begins',
            ru: 'Live Activity сам запускается на старте поездки',
          },
          {
            en: 'Smart Stack card on Apple Watch (via Live Activity)',
            ru: 'Карточка в Smart Stack на Apple Watch (через Live Activity)',
          },
          {
            en: '"Forgot to stop?" reminder push',
            ru: 'Пуш «забыл остановить запись»',
          },
          {
            en: 'False auto-stop fixes (no more spurious end-trip)',
            ru: 'Фикс ложных автостопов записи',
          },
          {
            en: 'Extended junk filter (maxSpeed < 15 km/h AND duration > 3 min → delete)',
            ru: 'Расширенный мусорный фильтр (maxSpeed < 15 км/ч + duration > 3 мин → удаление)',
          },
          {
            en: 'Feed auto-refresh on trip end',
            ru: 'Автообновление ленты после завершения поездки',
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Q2 2026 — Cloud & Social', ru: 'Q2 2026 — Облако и лента' },
    status: 'done',
    milestones: [
      {
        version: 'v0.5.0',
        name: 'Cloud Backbone',
        date: { en: 'Early May', ru: 'Начало мая' },
        status: 'done',
        features: [
          {
            en: 'Sign in with Apple — your account, your trips',
            ru: 'Sign in with Apple — твой аккаунт, твои поездки',
          },
          {
            en: 'NestJS backend live at api.trip-track.app',
            ru: 'NestJS-бэкенд развернут на api.trip-track.app',
          },
          {
            en: 'Offline-first sync with eventual consistency',
            ru: 'Offline-first синхронизация с eventual consistency',
          },
          {
            en: 'Public/private trips — share what you want, hide the rest',
            ru: 'Публичные и приватные поездки — шеришь что хочешь, прячешь остальное',
          },
          {
            en: 'Social feed with emoji reactions',
            ru: 'Социальная лента с эмодзи-реакциями',
          },
          {
            en: 'Follow & unfollow other drivers',
            ru: 'Подписка и отписка на водителей',
          },
          {
            en: 'Public profile pages with recent trips',
            ru: 'Публичные профили с последними поездками',
          },
          {
            en: 'Block users you don\'t want to see',
            ru: 'Блокировка пользователей',
          },
          {
            en: 'Full account deletion — wipes server data clean',
            ru: 'Полное удаление аккаунта — стирает данные на сервере',
          },
          {
            en: 'EXIF strip on every uploaded photo (privacy-by-default)',
            ru: 'EXIF снимается с каждого загружаемого фото (приватность по умолчанию)',
          },
          {
            en: 'Cloudflare R2 photo storage with deferred upload',
            ru: 'Фото в Cloudflare R2 с отложенной загрузкой',
          },
        ],
      },
    ],
  },
  {
    label: { en: 'Q2 2026 — Polish', ru: 'Q2 2026 — Полировка' },
    status: 'current',
    milestones: [
      {
        version: 'v0.5.5',
        name: 'Onboarding · Stats · Rating',
        date: { en: 'May 14', ru: '14 мая' },
        status: 'done',
        features: [
          {
            en: 'Onboarding redesigned — 3 pages with a working mock trip card',
            ru: 'Онбординг переделан — 3 страницы с живой карточкой-демо',
          },
          {
            en: 'After onboarding lands you on the tracking tab, not the empty feed',
            ru: 'После онбординга открывается экран записи, а не пустая лента',
          },
          {
            en: 'Stats screen redesigned — week / month / year / lifetime in a 2×2 grid',
            ru: 'Экран статистики переделан — неделя / месяц / год / всё время в 2×2 сетке',
          },
          {
            en: 'In-app rating prompt with smart guards (3+ trips, 7+ launches, 30-day cooldown)',
            ru: 'Запрос отзыва с умными фильтрами (3+ поездки, 7+ запусков, 30 дн. кулдаун)',
          },
          {
            en: '7 new secret badges (Midnight Rider, Centurion, Vault Keeper, Highway Wolf, Carpool Karaoke, Wrapped Year, Expedition)',
            ru: '7 новых секретных ачивок (Midnight Rider, Centurion, Vault Keeper, Highway Wolf, Carpool Karaoke, Wrapped Year, Expedition)',
          },
          {
            en: 'Profile last-active indicator',
            ru: 'Индикатор last-active в профиле',
          },
          {
            en: 'Reaction pill overflow fix on Pro Max screens',
            ru: 'Фикс переполнения реакций на Pro Max',
          },
        ],
      },
      {
        version: 'v0.5.6',
        name: 'Reliability · Retention · Richer Social Detail',
        date: { en: 'May 22', ru: '22 мая' },
        status: 'done',
        features: [
          {
            en: 'Auto-detect no longer ends recording mid-drive on momentary Bluetooth glitches in Remind mode',
            ru: 'Авто-детект больше не останавливает запись посреди поездки на ложных Bluetooth-сбоях в режиме «Напоминание»',
          },
          {
            en: 'Account stays signed in across long gaps — refresh tokens now rotate and effectively never expire',
            ru: 'Аккаунт остаётся залогинен после долгих перерывов — refresh-токены ротируются и фактически не истекают',
          },
          {
            en: 'Pull-to-refresh on "My Trips" no longer freezes on older iPhones — Core Data fetch moved to a background context',
            ru: 'Пул-ту-рефреш на «Моих поездках» больше не фризит на старых iPhone — Core Data вынесен на фоновый контекст',
          },
          {
            en: 'Friends\' trip detail now shows max altitude, driving time, stopped time — parity with your own trip detail',
            ru: 'В чужих поездках теперь видны: максимальная высота, время в движении, время стоя — как в своих собственных',
          },
          {
            en: 'Duration in friends\' trips reads as «1 ч 19 мин» instead of ambiguous «1:19»',
            ru: 'Время в чужих поездках читается как «1 ч 19 мин» вместо непонятного «1:19»',
          },
          {
            en: 'Sync errors retry automatically — operations no longer drop silently after a few failures',
            ru: 'Ошибки синхронизации теперь повторяются автоматически — операции больше не теряются молча после нескольких сбоев',
          },
          {
            en: 'Connectivity banner distinguishes "no network" from "server hiccup" — no more misleading "Server unreachable" while connection is fine',
            ru: 'Баннер соединения теперь различает «нет сети» и «ошибка сервера» — больше нет вводящего в заблуждение «Сервер недоступен» при работающем интернете',
          },
          {
            en: 'Comprehensive diagnostic logs across auto-detect and auth — Settings → Export logs for support',
            ru: 'Подробные диагностические логи в авто-детекте и аутентификации — Настройки → Экспорт логов для саппорта',
          },
        ],
      },
      {
        version: 'v0.5.7',
        name: 'Reliability · Vehicles · Sharing',
        date: { en: 'Jun 13', ru: '13 июн' },
        status: 'done',
        features: [
          {
            en: 'Rock-solid tracking in remote / no-signal areas — GPS fixes are no longer dropped, so long taiga drives record instead of showing "0 km"',
            ru: 'Надёжная запись в глуши и без связи — таёжные GPS-фиксы больше не отбрасываются, длинный трек пишется, а не показывает «0 км»',
          },
          {
            en: 'Live Activity keeps a live distance and working buttons on multi-day trips (past the iOS ~8h limit); a drive killed mid-route resumes as one track',
            ru: 'Live Activity держит живую дистанцию и рабочие кнопки на многодневном треке (за лимитом iOS ~8 ч); прерванная посреди дороги поездка продолжается одним треком',
          },
          {
            en: 'Change the vehicle on an already-saved trip; active recording shows which car the trip is for',
            ru: 'Смена машины у уже сохранённой поездки; в активной записи видно, для какой машины едешь',
          },
          {
            en: 'Siri & Shortcuts start with the car you actually picked — no more always-first-vehicle',
            ru: 'Siri и Команды стартуют с выбранной машиной, а не всегда с первой',
          },
          {
            en: 'No more random sign-outs on flaky networks — refresh-token rotation is now loss-tolerant',
            ru: 'Больше нет случайных разлогинов на нестабильной сети — ротация токена устойчива к потере ответа',
          },
          {
            en: 'Logged-out "Share" now prompts sign-in and resumes the share afterwards',
            ru: 'Кнопка «Поделиться» у разлогиненных предлагает вход и возобновляет шеринг после него',
          },
          {
            en: 'Night Rider & other time badges now count any trip that overlaps the window, not just its start hour',
            ru: 'Ночные/утренние ачивки засчитываются, если поездка попадает в окно в любой момент, а не только по часу старта',
          },
          {
            en: 'Choose how average speed is measured — overall, or moving-only (excludes stops & pauses); double-tap to zoom trip photos',
            ru: 'Выбор расчёта средней скорости — общая или «в движении» (без остановок и пауз); зум фото поездки по даблтапу',
          },
          {
            en: '"Regions" renamed to "Places", the feed\'s "Mine" tab to "Trips"; clearer stats calendar (today ring + legend)',
            ru: '«Регионы» → «Места», вкладка «Мои» → «Поездки»; понятнее календарь статистики (кольцо «сегодня» + легенда)',
          },
        ],
      },
      {
        version: 'v0.5.8',
        name: 'Field Fixes · Globe Opt-in',
        date: { en: 'Jun 16', ru: '16 июн' },
        status: 'done',
        note: {
          en: 'Newest build — subscriber field feedback + opt-in trips on the website globe',
          ru: 'Свежий билд — фидбэк подписчика с дороги + опт-ин публикации поездок на глобусе сайта',
        },
        features: [
          {
            en: 'Opt in to show your public trips on the website globe — off by default, routes anonymized, private trips never shown',
            ru: 'Опт-ин показа своих публичных поездок на глобусе сайта — по умолчанию выкл, маршрут анонимизируется, приватные не показываются',
          },
          {
            en: 'Route line no longer flickers while recording — smoother live map',
            ru: 'Линия маршрута больше не мигает при записи — карта стала плавной',
          },
          {
            en: 'Speedometer correctly reads 0 at a full stop (no more "16 km/h" at a red light)',
            ru: 'Спидометр честно показывает 0 на остановке (больше не «16 км/ч» на светофоре)',
          },
          {
            en: 'Fixed a launch-screen hang on the "Ready to drive" screen',
            ru: 'Исправлено зависание экрана «Готов к поездке» при запуске',
          },
          {
            en: 'Feed loads instantly on cold start — no manual pull-to-refresh',
            ru: 'Лента загружается сразу на холодном старте — без ручного pull-to-refresh',
          },
          {
            en: 'Photos upload in full quality on any network, not just Wi-Fi',
            ru: 'Фото грузятся в полном качестве на любой сети, а не только по Wi-Fi',
          },
          {
            en: 'Trip notes are easier to find and add',
            ru: 'Заметки к поездке проще найти и добавить',
          },
        ],
      },
      {
        version: 'v0.6.0',
        name: 'Redesign · Companions',
        date: { en: 'Aug 14', ru: '14 авг' },
        status: 'current',
        note: {
          en: 'The whole app redrawn — and a trip you can share with everyone who was in the car',
          ru: 'Приложение перерисовано целиком — и поездку теперь можно разделить с теми, кто ехал рядом',
        },
        features: [
          {
            en: 'Companions — invite the people who rode with you; their photos land on the trip and it joins their history too',
            ru: 'Попутчики — пригласите тех, кто ехал с вами: их фото появляются в поездке, и она попадает в их историю',
          },
          {
            en: 'Discussions — comments with replies on public trips, reactions and a "who reacted" list',
            ru: 'Обсуждения — комментарии с ответами к публичным поездкам, реакции и список «кто отреагировал»',
          },
          {
            en: 'Replay a drive like a film; share it as a story poster or a link',
            ru: 'Реплей маршрута как маленькое кино; постер для истории или ссылка',
          },
          {
            en: 'Five tabs — Feed, Map, Record, Groups, Me — with your own map of every road you have driven',
            ru: 'Пять вкладок — Лента, Карта, Запись, Группы, Я — со своей картой всех проеханных дорог',
          },
          {
            en: 'Profile: achievements, levels, followers, and a "how others see you" preview',
            ru: 'Профиль: достижения, уровни, подписчики и превью «как видят другие»',
          },
          {
            en: 'Shared profile links open a real profile page instead of the marketing site',
            ru: 'Ссылка на профиль открывает настоящую страницу профиля, а не промо-сайт',
          },
          {
            en: 'The "All" feed is strictly newest-first, whoever the drive belongs to',
            ru: '«Все» в ленте — строго по дате, чья бы поездка ни была',
          },
          {
            en: 'Clubs preview with a real waiting list you can join',
            ru: 'Превью клубов с настоящим списком ожидания',
          },
          {
            en: 'Delete your account in-app — server and device, and it says so before it does',
            ru: 'Удаление аккаунта прямо в приложении — и сервер, и устройство, о чём сказано заранее',
          },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  COMING NEXT — actively in build, no fixed dates                           */
/* -------------------------------------------------------------------------- */

const COMING_NEXT: BenchItem[] = [
  {
    icon: Watch,
    title: { en: 'Apple Watch companion', ru: 'Приложение для Apple Watch' },
    body: {
      en: 'Start, pause, stop your trip from the wrist. Speed and distance live on the watch face. The phone stays in your pocket.',
      ru: 'Старт, пауза, стоп с запястья. Скорость и расстояние прямо на циферблате. Телефон лежит в кармане.',
    },
    meta: {
      en: 'Code complete — waiting on icon assets and real-hardware testing',
      ru: 'Код готов — ждём дизайн иконок и тест на реальном железе',
    },
  },
  {
    icon: Sparkles,
    title: {
      en: '"NEW" badge on freshly-published trips',
      ru: 'Бейдж «NEW» на свежеопубликованных поездках',
    },
    body: {
      en: 'Trips you publicly share will get a 24-hour highlight in the feed, so followers don\'t miss them.',
      ru: 'Поездки, которые ты публикуешь, будут подсвечены в ленте 24 часа — чтобы подписчики не пропустили.',
    },
  },
  {
    icon: ImageIcon,
    title: {
      en: 'Sharper share-card map',
      ru: 'Резкая карта на share-card',
    },
    body: {
      en: 'Pre-warm the map at the share-sheet width — no more low-res flash before the sharp version pops in.',
      ru: 'Прогрев карты под ширину share-sheet — без вспышки низкого разрешения перед резким финалом.',
    },
  },
  {
    icon: Server,
    title: { en: 'Backend hardening', ru: 'Усиление бэкенда' },
    body: {
      en: 'Cron multi-instance lock, parallel recap fan-out, partial DB index for trip-by-account lookups. The boring work that keeps it fast at scale.',
      ru: 'Лок для cron на нескольких инстансах, параллельный fan-out для recap, partial-индекс для поиска поездок по аккаунту. Скучная работа, которая держит скорость на масштабе.',
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  ON THE HORIZON — wishlist; we're listening before we commit               */
/* -------------------------------------------------------------------------- */

const HORIZON: BenchItem[] = [
  {
    icon: Cloud,
    title: { en: 'Multi-device sync', ru: 'Синхронизация между устройствами' },
    body: {
      en: 'Open the same trips on your iPhone, iPad, and (one day) Mac. Architecture is designed; rollout is staged.',
      ru: 'Открывай те же поездки на iPhone, iPad и (когда-нибудь) Mac. Архитектура готова; раскатка поэтапная.',
    },
  },
  {
    icon: Calendar,
    title: { en: 'Year-in-Review', ru: 'Год в дороге' },
    body: {
      en: 'Spotify-Wrapped for your roads — a personal recap of every drive you took this year. Sharable.',
      ru: 'Spotify Wrapped для твоих дорог — личный рекап каждой поездки за год. Можно делиться.',
    },
  },
  {
    icon: Tag,
    title: { en: 'Trip categories & tags', ru: 'Категории и теги поездок' },
    body: {
      en: '"To the dacha", "commute", "road trip" — label your drives, then filter the feed by what matters.',
      ru: '«На дачу», «работа», «road trip» — подписывай поездки, потом фильтруй ленту по тому что важно.',
    },
  },
  {
    icon: Search,
    title: { en: 'Search across trips', ru: 'Поиск по поездкам' },
    body: {
      en: 'Find that one trip last March by region, title, or distance. Currently we search drivers — next we search drives.',
      ru: 'Найти ту самую поездку из марта по региону, названию или расстоянию. Сейчас ищем водителей — следующим этапом будем искать поездки.',
    },
  },
  {
    icon: LinkIcon,
    title: { en: 'Universal Links for shared trips', ru: 'Universal Links для шеринга поездок' },
    body: {
      en: 'Share a trip link — friends with the app open it natively, no copy-paste of URLs in browsers.',
      ru: 'Кидаешь ссылку — у друзей с приложением она открывается прямо в нём, без копипаста из браузера.',
    },
  },
  {
    icon: ImageIcon,
    title: { en: 'Multi-trip recap map', ru: 'Сводная карта поездок' },
    body: {
      en: 'All your drives this week (or month) on one shareable image — like a road-art print.',
      ru: 'Все твои поездки за неделю (или месяц) на одной шеринговой картинке — как road-art постер.',
    },
  },
  {
    icon: MessageCircle,
    title: { en: 'Comments on public trips', ru: 'Комментарии к публичным поездкам' },
    body: {
      en: 'Move past reactions — actual conversations on someone\'s great drive.',
      ru: 'Шаг дальше реакций — реальные разговоры под чьим-то крутым маршрутом.',
    },
  },
  {
    icon: Users,
    title: { en: 'Friends-only feed', ru: 'Лента «только друзья»' },
    body: {
      en: 'A second feed showing only people you follow — no algorithm, no strangers.',
      ru: 'Вторая лента — только те, на кого ты подписан. Без алгоритма, без чужих.',
    },
  },
  {
    icon: Car,
    title: { en: 'CarPlay support', ru: 'Поддержка CarPlay' },
    body: {
      en: 'A trip controller right on the dashboard — start, pause, current stats, hands stay on the wheel.',
      ru: 'Контроллер поездки прямо на панели приборов — старт, пауза, текущая стата, руки на руле.',
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  WHAT WE'RE NOT — anti-positioning                                          */
/* -------------------------------------------------------------------------- */

const NOT_DOING: NotItem[] = [
  {
    icon: Gauge,
    title: { en: 'Not a speed tracker', ru: 'Не спид-трекер' },
    body: {
      en: 'We don\'t care about your 0–60 time, lap leaderboard, or G-force. There are apps for that. We care that you remember the road.',
      ru: 'Нам неинтересны разгон 0–100, лидерборды по кругу и перегрузки. Для этого есть свои приложения. Нам важно, чтобы ты запомнил дорогу.',
    },
  },
  {
    icon: Receipt,
    title: { en: 'Not a tax tool', ru: 'Не инструмент для налогов' },
    body: {
      en: 'No mileage reports for the IRS, no per-trip business/personal toggle, no expense ledger. Drive for joy, not for accounting.',
      ru: 'Нет отчётов километража для налоговой, нет переключателя «работа/личное», нет журнала расходов. Езди для удовольствия, не для бухгалтерии.',
    },
  },
  {
    icon: Plane,
    title: { en: 'Not a vacation planner', ru: 'Не планер отпусков' },
    body: {
      en: 'We\'re not for the once-a-year trip abroad with itineraries and check-lists. We\'re for the weekend drive, the dacha run, the Wednesday detour.',
      ru: 'Мы не про раз в год поездку с маршрутным листом и чек-листами. Мы про субботний выезд, дачу, вечерний крюк по городу.',
    },
  },
  {
    icon: Wrench,
    title: { en: 'Not hardware-tethered', ru: 'Не привязан к железу' },
    body: {
      en: 'No OBD2 dongle to plug in, no Bluetooth puck to forget, no fleet contract. Just an iPhone in your pocket — that\'s the whole stack.',
      ru: 'Никаких OBD2-донглов, никаких Bluetooth-датчиков, никаких корпоративных тарифов. iPhone в кармане — это весь стек.',
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  Visual tokens — match existing site palette                               */
/* -------------------------------------------------------------------------- */

const DOT_COLOR: Record<Status, string> = {
  done: '#2EAE50',
  current: '#EB571E',
  planned: 'rgba(30,30,35,0.15)',
  future: 'rgba(30,30,35,0.08)',
};

const BADGE_CLASS: Record<Status, string> = {
  done: 'bg-[#2EAE50]/10 text-[#2EAE50]',
  current: 'bg-[#EB571E]/10 text-[#EB571E]',
  planned: 'bg-[#1e1e23]/5 text-[#1e1e23]/40',
  future: 'bg-[#1e1e23]/5 text-[#1e1e23]/30',
};

const CARD_CLASS: Record<Status, string> = {
  done: 'bg-white border-black/5',
  current: 'bg-white border-[#EB571E]/20 shadow-[0_0_20px_rgba(235,87,30,0.06)]',
  planned: 'bg-white border-black/5',
  future: 'bg-[#f8f6f2] border-black/5',
};

function lineColor(status: Status): string {
  if (status === 'done') return '#2EAE50';
  if (status === 'current') return '#EB571E';
  return 'rgba(30,30,35,0.1)';
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Roadmap() {
  const { lang } = useTranslation();
  const l = (obj: Bilingual) => (lang === 'ru' ? obj.ru : obj.en);

  usePageMeta(
    lang === 'ru'
      ? 'Дорожная карта — TripTrack: автодневник поездок для iPhone'
      : 'Roadmap — TripTrack: the driving journal that writes itself',
    lang === 'ru'
      ? 'Что мы строим дальше в TripTrack — приложении, которое само записывает маршруты, фото и статистику поездок. Бесплатный аналог Google Timeline для водителей. Apple Watch, синхронизация, CarPlay — что отгружено, что в работе, что в планах.'
      : 'See what\'s shipping next in TripTrack — the iOS app that auto-records your drives, routes, and road-trip photos. Apple Watch, multi-device sync, CarPlay — what\'s shipped, what\'s next, what we\'re considering. A free Google Timeline alternative for drivers.',
  );

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-6 py-32">
      {/* HERO */}
      <section className="text-center mb-14">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 text-[#1e1e23]">
          {lang === 'ru' ? 'Куда движется TripTrack' : 'Where TripTrack is heading'}
        </h1>
        <p className="text-[#1e1e23]/55 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          {lang === 'ru' ? (
            <>
              Это автодневник поездок — не спид-трекер, не отчёт для налоговой, не планер отпусков.
              Большинство приложений считает, как сильно ты вдавил педаль, или сколько должен с километров.
              Мы просто запоминаем, куда ты ездил в субботу — маршрут, фото на смотровой, перепад высот, и плейбэк
              в той скорости, в которой ты на самом деле ехал.
            </>
          ) : (
            <>
              A driving journal — not a speed tracker, not a tax tool, not a vacation planner.
              Most apps measure how hard you pushed the pedal or what you owe per mile.
              We just remember where you went last Saturday — the route, the photos at the lookout,
              the elevation gain on the pass, and a playback of the drive at the speed you actually drove.
            </>
          )}
        </p>
      </section>

      {/* MOMENTUM — proof we ship */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-20">
        {[
          { num: '5', label: { en: 'versions in 60 days', ru: 'версий за 60 дней' } },
          { num: '39', label: { en: 'achievements (7 secret)', ru: 'ачивок (7 секретных)' } },
          { num: '2', label: { en: 'languages — RU & EN', ru: 'языка — RU и EN' } },
          { num: '0', label: { en: 'paywalls or trackers', ru: 'пейволлов и трекеров' } },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-black/5 rounded-2xl px-3 py-5 text-center shadow-sm"
          >
            <div className="text-3xl font-bold tracking-tight text-[#EB571E] mb-1">
              {stat.num}
            </div>
            <div className="text-[11px] text-[#1e1e23]/50 leading-tight">
              {l(stat.label)}
            </div>
          </div>
        ))}
      </section>

      {/* SECTION HEADER — Shipped */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-5 h-5 text-[#2EAE50]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2EAE50]">
            {lang === 'ru' ? '01 — Уже отгружено' : '01 — Shipped'}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#1e1e23]">
          {lang === 'ru' ? 'Что уже работает в приложении' : 'What\'s already in the app'}
        </h2>
        <p className="text-[#1e1e23]/50 text-sm md:text-base leading-relaxed">
          {lang === 'ru'
            ? 'Каждая версия закрыта в TestFlight или App Store. Это не «скоро», это «уже».'
            : 'Every version listed below is in TestFlight or the App Store. Not "coming soon" — already there.'}
        </p>
      </section>

      {/* TIMELINE */}
      <div className="flex flex-col gap-0 mb-20">
        {SHIPPED.map((quarter, qi) => (
          <div key={qi}>
            {/* Quarter header row */}
            <div className="flex items-center gap-5 mb-6">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: DOT_COLOR[quarter.status] }}
              />
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#1e1e23]/35">
                {l(quarter.label)}
              </h3>
            </div>

            {/* Milestones */}
            {quarter.milestones.map((ms, mi) => {
              const isLast =
                qi === SHIPPED.length - 1 &&
                mi === quarter.milestones.length - 1;
              return (
                <div key={mi} className="flex gap-5">
                  {/* Line + dot column */}
                  <div className="flex flex-col items-center w-3 flex-shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border-[2.5px] bg-white flex-shrink-0"
                      style={{ borderColor: DOT_COLOR[ms.status] }}
                    />
                    {!isLast && (
                      <div
                        className="w-[3px] flex-1 min-h-[24px] rounded-full"
                        style={{
                          backgroundColor:
                            quarter.status === 'future'
                              ? 'transparent'
                              : lineColor(quarter.status),
                          borderLeft:
                            quarter.status === 'future'
                              ? '2px dashed rgba(30,30,35,0.1)'
                              : 'none',
                        }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className={`${CARD_CLASS[ms.status]} border rounded-2xl p-5 shadow-sm mb-4 flex-1`}
                  >
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span
                        className={`${BADGE_CLASS[ms.status]} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}
                      >
                        {ms.version}
                      </span>
                      {ms.name && (
                        <span className="text-sm font-semibold text-[#1e1e23]">
                          {ms.name}
                        </span>
                      )}
                      <span className="text-[11px] text-[#1e1e23]/25 ml-auto">
                        {l(ms.date)}
                      </span>
                    </div>

                    {ms.note && (
                      <div className="mb-3 text-[11px] font-medium text-[#EB571E] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#EB571E] animate-pulse" />
                        {l(ms.note)}
                      </div>
                    )}

                    <ul className="space-y-1.5">
                      {ms.features.map((f, fi) => (
                        <li
                          key={fi}
                          className="flex items-start gap-2 text-[13px] text-[#1e1e23]/60 leading-relaxed"
                        >
                          <span
                            className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0"
                            style={{ backgroundColor: DOT_COLOR[ms.status] }}
                          />
                          {l(f)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* SECTION HEADER — Coming next */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-[#EB571E]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EB571E]">
            {lang === 'ru' ? '02 — Скоро в апдейте' : '02 — Coming next'}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#1e1e23]">
          {lang === 'ru' ? 'Что лежит на верстаке' : 'What\'s on the build bench'}
        </h2>
        <p className="text-[#1e1e23]/50 text-sm md:text-base leading-relaxed">
          {lang === 'ru'
            ? 'Активная работа — должно приземлиться в одном из следующих релизов. Без обещаний по датам, но это уже не идеи на бумаге.'
            : 'Active work — should land in one of the next few releases. No date promises, but these aren\'t paper ideas anymore.'}
        </p>
      </section>

      <div className="flex flex-col gap-3 mb-20">
        {COMING_NEXT.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-[#EB571E]/15 rounded-2xl p-5 shadow-sm shadow-[#EB571E]/5"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EB571E]/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-[#EB571E]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[#1e1e23] mb-1.5">
                  {l(item.title)}
                </h3>
                <p className="text-[13px] text-[#1e1e23]/60 leading-relaxed mb-2">
                  {l(item.body)}
                </p>
                {item.meta && (
                  <div className="text-[11px] text-[#EB571E]/70 font-medium flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    {l(item.meta)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION HEADER — Horizon */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-[#1e1e23]/45" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e1e23]/45">
            {lang === 'ru' ? '03 — На горизонте' : '03 — On the horizon'}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#1e1e23]">
          {lang === 'ru' ? 'Что мы рассматриваем' : 'What we\'re thinking about'}
        </h2>
        <p className="text-[#1e1e23]/50 text-sm md:text-base leading-relaxed">
          {lang === 'ru'
            ? 'Идеи, которые нам нравятся. Слушаем водителей перед тем, как обещать. Скажи нам, что для тебя важнее — это сдвинет очередь.'
            : 'Ideas we like. We listen to drivers before we commit. Tell us which ones matter — it shifts the queue.'}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-24">
        {HORIZON.map((item, i) => (
          <div
            key={i}
            className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm flex gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1e1e23]/[0.04] flex items-center justify-center flex-shrink-0">
              <item.icon className="w-4 h-4 text-[#1e1e23]/55" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-[#1e1e23] mb-1 leading-snug">
                {l(item.title)}
              </h3>
              <p className="text-[12px] text-[#1e1e23]/55 leading-relaxed">
                {l(item.body)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION HEADER — Not doing (anti-positioning) */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <XIcon className="w-5 h-5 text-[#1e1e23]/40" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e1e23]/40">
            {lang === 'ru' ? '04 — Чем мы НЕ занимаемся' : '04 — What we\'re NOT'}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#1e1e23]">
          {lang === 'ru' ? 'То, что мы решили не строить' : 'The things we\'ve chosen not to build'}
        </h2>
        <p className="text-[#1e1e23]/50 text-sm md:text-base leading-relaxed">
          {lang === 'ru'
            ? 'Хороший продукт — это столько же про «нет», сколько про «да». Если эти вещи нужны тебе — отличные инструменты есть, мы рекомендуем.'
            : 'A good product is as much about "no" as "yes." If you need these things, great apps exist for them — we recommend you use them.'}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-24">
        {NOT_DOING.map((item, i) => (
          <div
            key={i}
            className="bg-[#f8f6f2] border border-black/5 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 relative">
                <item.icon className="w-4 h-4 text-[#1e1e23]/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-[1.5px] bg-[#1e1e23]/30 rotate-[-30deg]" />
                </div>
              </div>
              <h3 className="text-[14px] font-semibold text-[#1e1e23]">
                {l(item.title)}
              </h3>
            </div>
            <p className="text-[12px] text-[#1e1e23]/55 leading-relaxed">
              {l(item.body)}
            </p>
          </div>
        ))}
      </div>

      {/* MAKER NOTE + CTA */}
      <div className="bg-white border border-black/5 rounded-3xl p-8 md:p-10 shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EB571E]/10 mx-auto mb-5">
          <Heart className="w-5 h-5 text-[#EB571E]" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-3 text-[#1e1e23] tracking-tight">
          {lang === 'ru'
            ? 'Что бы ты добавил следующим?'
            : 'What would you build next?'}
        </h3>
        <p className="text-[#1e1e23]/55 text-center mb-8 max-w-md mx-auto text-[14px] leading-relaxed">
          {lang === 'ru'
            ? 'TripTrack делает водитель — для водителей. Реальный фидбэк двигает приоритеты. Telegram-канал открытый: предлагай, голосуй, спорь.'
            : 'TripTrack is built by a driver, for drivers. Real feedback moves priorities. The Telegram channel is open — pitch, vote, argue.'}
        </p>
        <div className="flex justify-center">
          <a
            href="https://t.me/triptrack_app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-8 py-4 font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_2px_20px_rgba(235,87,30,0.3)]"
          >
            <MessageCircle className="w-5 h-5" />
            {lang === 'ru' ? 'Написать в Telegram' : 'Join the Telegram'}
          </a>
        </div>
      </div>
    </div>
  );
}
