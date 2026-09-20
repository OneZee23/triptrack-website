import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    // Any thrown route error (including a bad lazy chunk) renders the same
    // branded page instead of React Router's developer error screen, which
    // is what a user following an expired share link used to see.
    lazy: () => import("./pages/NotFound").then((m) => ({ ErrorBoundary: m.default })),
    children: [
      { index: true, lazy: () => import("./pages/Home").then((m) => ({ Component: m.default })) },
      { path: "features", lazy: () => import("./pages/Features").then((m) => ({ Component: m.default })) },
      { path: "about", lazy: () => import("./pages/About").then((m) => ({ Component: m.default })) },
      { path: "download", lazy: () => import("./pages/Download").then((m) => ({ Component: m.default })) },
      { path: "roadmap", lazy: () => import("./pages/Roadmap").then((m) => ({ Component: m.default })) },
      {
        path: "google-timeline-alternative",
        lazy: () => import("./pages/GoogleTimeline").then((m) => ({ Component: m.default })),
      },
      { path: "fog-of-war-map", lazy: () => import("./pages/FogOfWarMap").then((m) => ({ Component: m.default })) },
      // "My trips": the signed-in section. One object, its children lazy,
      // so the whole thing (Apple SDK glue, API client, MapLibre) stays out
      // of every marketing route's chunk. `noindex` is set in the component
      // and mirrored by `Disallow: /app` in robots.txt.
      {
        path: "app",
        lazy: () => import("./app/AppShell").then((m) => ({ Component: m.default })),
        children: [
          { path: "login", lazy: () => import("./app/LoginPage").then((m) => ({ Component: m.default })) },
          { path: "trips", lazy: () => import("./app/TripsPage").then((m) => ({ Component: m.default })) },
          { path: "trips/:id", lazy: () => import("./app/TripPage").then((m) => ({ Component: m.default })) },
        ],
      },
      // Catch-all. Shared-trip links (/s/<code>) are meant to be proxied to
      // the backend by nginx; if that proxy is missing or the code is dead,
      // they land here and get told where the trip actually lives.
      { path: "*", lazy: () => import("./pages/NotFound").then((m) => ({ Component: m.default })) },
    ],
  },
]);
