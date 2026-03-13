import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login - in production, this would validate credentials
    if (email && password) {
      // For demo purposes, navigate to admin if email contains "admin"
      if (email.toLowerCase().includes("admin")) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001840] via-[#102A71] to-[#001840] flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-4">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="bg-[#F5C400] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-[#001840]" />
            </div>
            <div className="text-left">
              <span className="font-bold text-xl tracking-wide text-white">
                UniNav
              </span>
              <p className="text-[9px] text-[#FFDC5F] leading-none tracking-wider">
                Eastern Mindoro College
              </p>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3 mb-1">
            Welcome Back
          </h1>
          <p className="text-sm text-[#FFDC5F]">Sign in to access your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFDF0] rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#001840] font-semibold text-sm">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102A71]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-[#001840] font-semibold text-sm"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102A71]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#102A71] hover:text-[#001840] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#102A71] text-[#102A71] focus:ring-[#102A71]"
                />
                <span className="text-xs text-[#001840]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#102A71] hover:text-[#001840] font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 bg-[#102A71] hover:bg-[#001840] text-white font-semibold text-sm transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-[#001840]">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#102A71] hover:text-[#001840] font-semibold transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-3">
          <Link
            to="/"
            className="text-xs text-[#FFDC5F] hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}