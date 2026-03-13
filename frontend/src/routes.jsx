import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { QAChat } from "./pages/QAChat";
import { ARNavigation } from "./pages/ARNavigation";
import { EnrollmentGuide } from "./pages/EnrollmentGuide";
import { CampusMap } from "./pages/CampusMap";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { AdminDashboard } from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "qa", Component: QAChat },
      { path: "ar-navigation", Component: ARNavigation },
      { path: "enrollment-guide", Component: EnrollmentGuide },
      { path: "campus-map", Component: CampusMap },
    ],
  },
  // Standalone pages without Root layout
  { path: "/login", Component: Login },
  { path: "/signup", Component: SignUp },
  { path: "/admin", Component: AdminDashboard },
]);