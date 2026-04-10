import { createBrowserRouter } from "react-router";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Features from "./pages/Features";
import About from "./pages/About";
import Download from "./pages/Download";
import Roadmap from "./pages/Roadmap";

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
    ],
  },
]);
