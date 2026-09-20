import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import AppLayout from './components/AppLayout';
import RootBoundary from './components/RootBoundary';
import NotFound from './pages/NotFound';
import { LANG_PREFIX, routeFromPath } from './lib/site';

/**
 * The route tree, built twice from one description.
 *
 * Every page exists at two addresses — `/features` (English) and
 * `/ru/features` (Russian) — so the same children array is mounted under both
 * roots. Nothing about the language is passed down: `LanguageProvider` reads
 * it back off the pathname, which means a page can never disagree with its own
 * URL about what language it is in.
 *
 * The client gets `lazy` routes (a chunk per page, as before). The prerender
 * gets the same tree with the components already resolved: `renderToString`
 * cannot wait for a dynamic import, and a route that resolved halfway through
 * a build would put a different page in the HTML than the client renders.
 */

const IMPORTERS = {
  home: () => import('./pages/Home'),
  features: () => import('./pages/Features'),
  download: () => import('./pages/Download'),
  googleTimeline: () => import('./pages/GoogleTimeline'),
  fogOfWar: () => import('./pages/FogOfWarMap'),
  about: () => import('./pages/About'),
  roadmap: () => import('./pages/Roadmap'),
  privacy: () => import('./pages/Privacy'),
} satisfies Record<string, () => Promise<{ default: ComponentType }>>;

export type PageId = keyof typeof IMPORTERS;

/**
 * Page id → path relative to the language root. The empty path is the index;
 * `routes.spec.ts` holds this list against the one the sitemap walks, so a new
 * page cannot be reachable but unlisted (or listed but unreachable).
 */
export const PAGE_PATHS: { id: PageId; path: string }[] = [
  { id: 'home', path: '' },
  { id: 'features', path: 'features' },
  { id: 'download', path: 'download' },
  { id: 'googleTimeline', path: 'google-timeline-alternative' },
  { id: 'fogOfWar', path: 'fog-of-war-map' },
  { id: 'about', path: 'about' },
  { id: 'roadmap', path: 'roadmap' },
  { id: 'privacy', path: 'privacy' },
];

/** What a page contributes to its route: a component, or a promise of one. */
type PageModule =
  | { Component: ComponentType }
  | { lazy: () => Promise<{ Component: ComponentType }> };

function childrenFrom(resolve: (id: PageId) => PageModule): RouteObject[] {
  const pages: RouteObject[] = PAGE_PATHS.map(({ id, path }) =>
    path === '' ? { index: true, ...resolve(id) } : { path, ...resolve(id) },
  );
  // Catch-all. Shared-trip links (/s/<code>) are meant to be proxied to the
  // backend by nginx; if that proxy is missing or the code is dead, they land
  // here and get told where the trip actually lives. Eager on purpose: a 404
  // that needs a chunk to download is a 404 that can fail to render.
  return [...pages, { path: '*', Component: NotFound }];
}

function roots(children: () => RouteObject[]): RouteObject[] {
  return [
    // The Russian root first is only tidiness — React Router ranks `/ru` above
    // `/` by specificity regardless of order.
    { path: LANG_PREFIX.ru, Component: AppLayout, ErrorBoundary: RootBoundary, children: children() },
    { path: '/', Component: AppLayout, ErrorBoundary: RootBoundary, children: children() },
  ];
}

/** Which page a browser URL lands on, or undefined for an unknown address. */
export function pageIdFor(pathname: string): PageId | undefined {
  const route = routeFromPath(pathname);
  const slug = route === '/' ? '' : route.slice(1);
  return PAGE_PATHS.find((page) => page.path === slug)?.id;
}

/** Load one page's module. Used to resolve the landing page before hydration. */
export async function loadPage(id: PageId): Promise<ComponentType> {
  return (await IMPORTERS[id]()).default;
}

/**
 * Browser tree: one lazily-loaded chunk per page.
 *
 * `ready` is the page the browser landed on, already imported. React Router
 * cannot hydrate a route whose component is still a promise — it would throw
 * the prerendered markup away and render a blank fallback until the chunk
 * arrived, which is a flash of nothing on exactly the page the visitor came
 * for. Every OTHER page stays lazy, so navigating still costs one chunk.
 */
export function clientRoutes(ready?: { id: PageId; Component: ComponentType }): RouteObject[] {
  return roots(() =>
    childrenFrom((id) =>
      ready?.id === id
        ? { Component: ready.Component }
        : { lazy: () => IMPORTERS[id]().then((m) => ({ Component: m.default })) },
    ),
  );
}

/** Prerender tree: the same pages, already imported. */
export async function serverRoutes(): Promise<RouteObject[]> {
  const modules = {} as Record<PageId, ComponentType>;
  await Promise.all(
    (Object.keys(IMPORTERS) as PageId[]).map(async (id) => {
      modules[id] = (await IMPORTERS[id]()).default;
    }),
  );
  return roots(() => childrenFrom((id) => ({ Component: modules[id] })));
}
