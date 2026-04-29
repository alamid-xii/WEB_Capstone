import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { MapPin, Menu, X, ArrowRight, LogIn, LogOut, User, BookOpen, LayoutDashboard } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const publicLinks = [
  { label: "Home", to: "/" },
  { label: "Q&A Assistant", to: "/qa" },
  { label: "Enrollment Guide", to: "/enrollment-guide" },
  { label: "Campus Map", to: "/campus-map" },
];

const studentLinks = [
  { label: "Home", to: "/" },
  { label: "My Enrollments", to: "/my-enrollments" },
  { label: "Q&A Assistant", to: "/qa" },
  { label: "Enrollment Guide", to: "/enrollment-guide" },
  { label: "Campus Map", to: "/campus-map" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isAdmin = user?.role === "admin";
  const isRegistrar = user?.role === "registrar";
  const isStudent = isLoggedIn && !isAdmin && !isRegistrar;

  const navLinks = isStudent ? studentLinks : publicLinks;

  return (
    <header className="bg-[#001840] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[#F5C400] w-9 h-9 rounded-lg flex items-center justify-center shadow">
              <MapPin className="w-5 h-5 text-[#001840]" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-wide">UniNav</span>
              <p className="text-[9px] text-[#FFDC5F] leading-none tracking-widest uppercase">
                Eastern Mindoro College
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active =
                link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-[#102A71] text-[#FFDC5F]"
                      : "text-[#FFFDF0] hover:bg-[#102A71]/60 hover:text-[#FFDC5F]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div className="hidden md:flex items-center gap-2 bg-[#102A71]/50 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-[#FFDC5F]" />
                  <span className="text-sm text-white font-medium">{user?.name}</span>
                  {(isAdmin || isRegistrar) && (
                    <span className="text-xs bg-[#F5C400] text-[#001840] px-1.5 py-0.5 rounded font-bold uppercase">
                      {user?.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 border-2 border-[#FFDC5F] text-[#FFDC5F] hover:bg-[#FFDC5F] hover:text-[#001840] px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-md"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}

            {/* Role-based CTA */}
            {isAdmin && (
              <Link to="/admin"
                className="hidden lg:flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow">
                <LayoutDashboard className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            {isRegistrar && (
              <Link to="/registrar"
                className="hidden lg:flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow">
                <LayoutDashboard className="w-4 h-4" /> Registrar Panel
              </Link>
            )}
            {isStudent && (
              <Link to="/enroll"
                className="hidden lg:flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow">
                <BookOpen className="w-4 h-4" /> Enroll Now
              </Link>
            )}
            {!isLoggedIn && (
              <Link to="/enroll"
                className="hidden lg:flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#102A71] transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-[#001840] border-t border-[#102A71]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const active =
                link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-[#102A71] text-[#FFDC5F]" : "text-[#FFFDF0] hover:bg-[#102A71]/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isLoggedIn ? (
              <>
                <div className="px-4 py-3 text-sm border-t border-[#102A71] mt-2 bg-[#102A71]/30 rounded-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFDC5F]" />
                  <span className="text-white font-medium">{user?.name}</span>
                  {(isAdmin || isRegistrar) && (
                    <span className="text-xs bg-[#F5C400] text-[#001840] px-1.5 py-0.5 rounded font-bold uppercase ml-auto">
                      {user?.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold text-sm transition-all"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 border-2 border-[#FFDC5F] text-[#FFDC5F] hover:bg-[#FFDC5F] hover:text-[#001840] px-5 py-3 rounded-lg font-semibold text-sm transition-all">
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-3 rounded-lg font-semibold text-sm transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            {isRegistrar && (
              <Link to="/registrar" onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-3 rounded-lg font-semibold text-sm transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Registrar Panel
              </Link>
            )}
            {(isStudent || !isLoggedIn) && (
              <Link to="/enroll" onClick={() => setOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-3 rounded-lg font-semibold text-sm transition-colors">
                <BookOpen className="w-4 h-4" /> {isStudent ? "Enroll Now" : "Get Started"}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
