import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout";

const Home = lazy(() => import("./pages/Home"));
const Features = lazy(() => import("./pages/Features"));
const About = lazy(() => import("./pages/About"));
const Download = lazy(() => import("./pages/Download"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const GoogleTimeline = lazy(() => import("./pages/GoogleTimeline"));
const FogOfWarMap = lazy(() => import("./pages/FogOfWarMap"));
const NotFound = lazy(() => import("./pages/NotFound"));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    // Any thrown route error (including a bad lazy chunk) renders the same
    // branded page instead of React Router's developer error screen, which
    // is what a user following an expired share link used to see.
    ErrorBoundary: NotFound,
    children: [
      { index: true, Component: Home },
      { path: "features", Component: Features },
      { path: "about", Component: About },
      { path: "download", Component: Download },
      { path: "roadmap", Component: Roadmap },
      { path: "google-timeline-alternative", Component: GoogleTimeline },
      { path: "fog-of-war-map", Component: FogOfWarMap },
      // Catch-all. Shared-trip links (/s/<code>) are meant to be proxied to
      // the backend by nginx; if that proxy is missing or the code is dead,
      // they land here and get told where the trip actually lives.
      { path: "*", Component: NotFound },
    ],
  },
]);
