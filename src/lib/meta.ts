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
        'Auto-recording, speed-coloured routes, photos pinned to the road, places you keep coming back to, journeys, a fog of war atlas and a garage. All on device.',
    },
    ru: {
      title: 'Возможности — что TripTrack пишет и помнит',
      description:
        'Автозапись, маршрут в цветах скорости, фото на дороге, места, куда вы возвращаетесь, путешествия, атлас с туманом войны и гараж. Всё на самом телефоне.',
    },
  },
  '/download': {
    en: {
      title: 'Download TripTrack — free trip tracker for iPhone',
      description:
        'Get TripTrack free on the App Store. iPhone, iOS 17 or newer, no account, no ads. Start recording your first drive a minute after you open the app.',
    },
    ru: {
      title: 'Скачать TripTrack — трекер поездок для iPhone',
      description:
        'Скачайте TripTrack бесплатно в App Store. iPhone, iOS 17 и новее, без аккаунта и рекламы. Первая поездка записывается через минуту после установки.',
    },
  },
  '/google-timeline-alternative': {
    en: {
      title: 'Google Timeline alternative for iPhone — TripTrack',
      description:
        'Google switched off Timeline on the web and started deleting history. TripTrack is the Google Timeline alternative that keeps your drives on your iPhone.',
    },
    ru: {
      title: 'Альтернатива Google Timeline для iPhone',
      description:
        'Google выключил веб-Timeline и начал удалять историю. TripTrack — альтернатива Google Timeline, которая хранит ваши поездки на самом iPhone, а не в облаке.',
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
        'One developer, one car and 71,000 kilometres behind the wheel. Why a drive diary had to exist after Google Timeline died, and what TripTrack refuses to do.',
    },
    ru: {
      title: 'О проекте — дневник поездок, сделанный водителем',
      description:
        'Один разработчик, одна машина и 71 000 км за рулём. Почему дневник поездок пришлось сделать после смерти Google Timeline и чего TripTrack не делает никогда.',
    },
  },
  '/roadmap': {
    en: {
      title: 'Roadmap — what ships next in TripTrack',
      description:
        'Every version of the trip tracker and what comes next: places, journeys, the fog of war atlas, discoveries and honest units. Updated as each one ships.',
    },
    ru: {
      title: 'Роудмап — что дальше в TripTrack',
      description:
        'Все версии трекера поездок: что изменила каждая и что будет дальше — места, путешествия, атлас с туманом войны, находки и честные единицы. Обновляется всегда.',
    },
  },
  '/privacy': {
    en: {
      title: 'Privacy — your drives stay on your phone',
      description:
        'What TripTrack keeps on your iPhone, what leaves it only if you turn Cloud Sync on, why this site sets no tracking cookies, and how to delete it all at once.',
    },
    ru: {
      title: 'Приватность — поездки остаются на телефоне',
      description:
        'Что TripTrack хранит на iPhone, что уезжает только при включённом Cloud Sync, почему на сайте нет отслеживающих cookies и как удалить всё сразу и навсегда.',
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
