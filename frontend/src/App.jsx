import { BrowserRouter, Routes, Route } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { QAChat } from "./pages/QAChat";
import { ARNavigation } from "./pages/ARNavigation";
import { EnrollmentGuide } from "./pages/EnrollmentGuide";
import { CampusMap } from "./pages/CampusMap";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { AdminDashboard } from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages with Navbar + Footer layout */}
        <Route element={<Root />}>
          <Route index element={<Home />} />
          <Route path="qa" element={<QAChat />} />
          <Route path="ar-navigation" element={<ARNavigation />} />
          <Route path="enrollment-guide" element={<EnrollmentGuide />} />
          <Route path="campus-map" element={<CampusMap />} />
        </Route>

        {/* Standalone pages without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
