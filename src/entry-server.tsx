import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { serverRoutes } from './routes';
import { SITE_URL } from './lib/site';

/**
 * The build-time renderer. No browser, no jsdom: `createStaticHandler` matches
 * the URL, `renderToString` turns the match into markup, and
 * `scripts/prerender.mjs` drops that markup into the built `index.html`.
 *
 * `hydrate={false}` keeps React Router from emitting its hydration-data
 * `<script>`: there are no loaders on this site, so the script would carry
 * nothing — and an inline script would need a CSP exception to run at all.
 */
export async function render(path: string): Promise<string> {
  const routes = await serverRoutes();
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`${SITE_URL}${path}`));
  if (context instanceof Response) {
    throw new Error(`prerender: ${path} answered with a redirect (${context.status}), which no route should do`);
  }
  const router = createStaticRouter(routes, context);
  return renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </StrictMode>,
  );
}

// Re-exported so the prerender script reads the SAME tables the app does,
// without needing a TypeScript loader of its own.
export { buildHead, buildRobots, buildSitemap } from './lib/head';
export { PAGE_META } from './lib/meta';
export { href, LANGS, ROUTES, SITE_URL } from './lib/site';
