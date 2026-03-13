import { useState } from "react";
import { Link, useLocation } from "react-router";
import { MapPin, Menu, X, ArrowRight, LogIn } from "lucide-react";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Q&A Assistant", to: "/qa" },
  { label: "AR Navigation", to: "/ar-navigation" },
  { label: "Enrollment Guide", to: "/enrollment-guide" },
  { label: "Campus Map", to: "/campus-map" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 border border-[#FFDC5F] text-[#FFDC5F] hover:bg-[#FFDC5F] hover:text-[#001840] px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-150"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link
              to="/qa"
              className="hidden lg:flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-150 shadow"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
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
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-[#102A71] text-[#FFDC5F]"
                      : "text-[#FFFDF0] hover:bg-[#102A71]/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/qa"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-3 rounded-lg font-semibold text-sm transition-colors duration-150"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}