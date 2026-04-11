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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Home },
      { path: "features", Component: Features },
      { path: "about", Component: About },
      { path: "download", Component: Download },
      { path: "roadmap", Component: Roadmap },
      { path: "google-timeline-alternative", Component: GoogleTimeline },
      { path: "fog-of-war-map", Component: FogOfWarMap },
    ],
  },
]);
