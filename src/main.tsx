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
  if (container.firstElementChild) hydrateRoot(container, app);
  else createRoot(container).render(app);
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
