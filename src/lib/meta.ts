import type { Lang, Route } from './site';

/**
 * Title and description for every page, in every language — one table, read by
 * three different consumers: the prerender script (which writes them into the
 * static `<head>`), `usePageMeta` (which keeps them right after a client-side
 * navigation) and `meta.spec.ts` (which keeps them inside the lengths Google
 * actually renders).
 *
 * Rules the test enforces, so they can't rot:
 *   - title ≤ 60 characters — longer and the tail is replaced by an ellipsis;
 *   - description 140–160 — shorter wastes the snippet, longer gets cut;
 *   - every route × every language is filled in.
 *
 * The copy carries the queries the site is supposed to be found by
 * («trip tracker for iPhone», «drive diary», «Google Timeline alternative»,
 * «fog of war map» / «трекер поездок», «дневник поездок», «альтернатива Google
 * Timeline», «туман войны на карте») — but only where they are true of the
 * page. A keyword in the title of a page that doesn't deliver it is a bounce.
 */
export interface PageMeta {
  title: string;
  description: string;
}

/**
 * Pages that have meta: every indexable route, plus the two that are not
 * indexable — the 404 shell and the signed-in `/app` section.
 */
export type MetaKey = Route | '404' | 'app';

/**
 * The pages that must never be indexed, and the robots line each one gets.
 *
 * The 404 exists at every wrong address at once, so it may be followed but
 * not indexed. `/app` needs a session to show anything at all, so there is
 * nothing to follow either — the same pair `src/app/meta.ts` writes into the
 * live DOM. Both are here rather than as `if (key === …)` in three files: the
 * question "is this page for search engines" has one answer, in one place.
 */
export const NOINDEX_ROBOTS: Partial<Record<MetaKey, string>> = {
  '404': 'noindex, follow',
  app: 'noindex, nofollow',
};

/** An indexable key is a real route: it has a canonical URL and hreflang. */
export function isIndexable(key: MetaKey): key is Route {
  return !(key in NOINDEX_ROBOTS);
}

export const PAGE_META: Record<MetaKey, Record<Lang, PageMeta>> = {
  '/': {
    en: {
      title: 'TripTrack — drive diary and trip tracker for iPhone',
      description:
        'A trip tracker for iPhone that records every drive by itself and keeps it as a drive diary: route, photos, stats, places and a fog of war map you uncover.',
    },
    ru: {
      title: 'TripTrack — дневник поездок и трекер для iPhone',
      description:
        'Трекер поездок для iPhone: записывает каждую поездку сам и хранит её как дневник поездок — маршрут, фото, статистика, места и туман войны на карте.',
    },
  },
  '/features': {
    en: {
      title: 'Features — what TripTrack records and remembers',
      description:
        'Explore TripTrack: background recording, route photos, places, journeys, a vehicle garage and a fog of war atlas. View your synced trips in the browser.',
    },
    ru: {
      title: 'Возможности — что TripTrack пишет и помнит',
      description:
        'Возможности TripTrack: запись в фоне, фото на маршруте, места, путешествия, гараж и атлас с туманом войны. Синхронизированные поездки доступны в браузере.',
    },
  },
  '/download': {
    en: {
      title: 'Download TripTrack — free trip tracker for iPhone',
      description:
        'Download TripTrack for iPhone with iOS 17 or later. Record drives, keep photos and explore your routes for free. Apple sign-in is optional for cloud sync.',
    },
    ru: {
      title: 'Скачать TripTrack — трекер поездок для iPhone',
      description:
        'Скачайте TripTrack для iPhone с iOS 17 и новее. Записывайте поездки, храните фото и смотрите маршруты бесплатно. Вход через Apple нужен для синхронизации.',
    },
  },
  '/google-timeline-alternative': {
    en: {
      title: 'Google Timeline alternative for iPhone — TripTrack',
      description:
        'Looking for a Google Timeline alternative for driving? Record trips on iPhone with TripTrack and explore your synced routes on a bigger map in the browser.',
    },
    ru: {
      title: 'Альтернатива Google Timeline для iPhone',
      description:
        'Ищете альтернативу Google Timeline для поездок? TripTrack записывает маршруты на iPhone и показывает синхронизированную историю на большой карте в браузере.',
    },
  },
  '/fog-of-war-map': {
    en: {
      title: 'Fog of war map for drivers — TripTrack for iPhone',
      description:
        'The world starts under fog and clears where you have driven. A fog of war map that turns everyday roads into an atlas you build one kilometre at a time.',
    },
    ru: {
      title: 'Туман войны на карте — TripTrack для iPhone',
      description:
        'Мир начинается под мглой и открывается там, где вы проехали. Туман войны на карте превращает обычные дороги в атлас, который вы собираете километрами.',
    },
  },
  '/about': {
    en: {
      title: 'About TripTrack — a drive diary built by a driver',
      description:
        'One developer building the driving diary he wanted to use: routes, photos and everyday memories. Learn how TripTrack began and why the core diary is free.',
    },
    ru: {
      title: 'О проекте — дневник поездок, сделанный водителем',
      description:
        'Один разработчик делает дневник, которым пользуется сам: маршруты, фотографии и воспоминания о поездках. Как появился TripTrack и почему его основа бесплатна.',
    },
  },
  '/roadmap': {
    en: {
      title: 'Roadmap — what ships next in TripTrack',
      description:
        'What is available in TripTrack today, what is being prepared and what is planned next. Follow the web viewer, optional PRO and future trip diary updates.',
    },
    ru: {
      title: 'Роудмап — что дальше в TripTrack',
      description:
        'Что уже доступно в TripTrack, что готовится к выпуску и что запланировано: просмотр поездок в браузере, необязательная PRO и будущие обновления дневника.',
    },
  },
  '/privacy': {
    en: {
      title: 'Privacy — local trips and optional cloud sync',
      description:
        'How TripTrack stores trips on your iPhone, what optional cloud sync sends to our server, how the web viewer uses your data, and how to delete your account.',
    },
    ru: {
      title: 'Приватность — поездки, синхронизация и сайт',
      description:
        'Как TripTrack хранит поездки на iPhone, какие данные отправляет синхронизация, как работает просмотр в браузере и как удалить свой аккаунт вместе с данными.',
    },
  },
  app: {
    // Never in a search result — `noindex`, and out of the sitemap — so this
    // pair exists only for the browser tab and the share card of a link
    // someone pastes to themselves. Short on purpose; the snippet-length rule
    // in meta.spec.ts is about search results and does not apply.
    en: {
      title: 'My trips — TripTrack',
      description: 'Your own trips from the TripTrack app, in the browser. Private: only you can see them.',
    },
    ru: {
      title: 'Мои поездки — TripTrack',
      description: 'Ваши поездки из приложения TripTrack в браузере. Их видите только вы.',
    },
  },
  '404': {
    en: {
      title: 'Page not found — TripTrack',
      description:
        'This link did not open. If it was a shared trip, the code may have expired — the trip itself is still in the TripTrack app on the phone that recorded it.',
    },
    ru: {
      title: 'Страница не найдена — TripTrack',
      description:
        'Ссылка не открылась. Если это была поездка, код мог устареть — сама поездка никуда не делась и лежит в приложении TripTrack на телефоне, который её записал.',
    },
  },
};

export const TITLE_MAX = 60;
export const DESC_MIN = 140;
export const DESC_MAX = 160;
