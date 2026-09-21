import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './globals.css';
import { clientRoutes, loadPage, pageIdFor, type PageId } from './routes';

/**
 * Entry point. Every marketing page ships prerendered markup inside `#root`,
 * so the normal path is `hydrateRoot` — attaching to what is already on screen
 * rather than throwing it away and painting it again. `createRoot` stays as
 * the fallback for an address with no prerendered HTML of its own (an unknown
 * URL served the SPA shell by nginx).
 *
 * The landing page's chunk is imported BEFORE the router is created: a route
 * that is still a promise cannot be hydrated, and React Router would blank the
 * page until the import landed.
 */
const container = document.getElementById('root')!;

function start(ready?: { id: PageId; Component: ComponentType }) {
  const app = (
    <StrictMode>
      <RouterProvider router={createBrowserRouter(clientRoutes(ready))} />
    </StrictMode>
  );
  // Hydrate only when the markup already in #root belongs to THIS address.
  //
  // Every prerendered page has a file of its own, so `ready` is exactly the
  // test: it is set when the URL matched a page we could import. Anything else
  // — the signed-in `/app` area, an unknown address — is served the home page
  // as an SPA shell by `try_files ... /index.html`, and that markup is not
  // this route's. Attaching to it asked React Router to hydrate a route whose
  // component was still a promise; with no `HydrateFallback` it declines, logs
  // a warning and LEAVES THE HOME PAGE ON SCREEN. A link straight to
  // /app/login, or a shared /app/trips/<id>, never rendered at all.
  if (ready && container.firstElementChild) {
    hydrateRoot(container, app);
  } else {
    // createRoot appends; the shell's markup has to go first or the home page
    // stays underneath whatever renders.
    container.replaceChildren();
    createRoot(container).render(app);
  }
}

const id = pageIdFor(window.location.pathname);
if (id) {
  loadPage(id).then(
    (Component) => start({ id, Component }),
    // A failed chunk is the error boundary's problem, not a reason to not boot.
    () => start(),
  );
} else {
  start();
}
