import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    // Mock registration - in production, this would create an account
    if (formData.email && formData.password && formData.fullName) {
      navigate("/login");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#001840] via-[#102A71] to-[#001840] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-4">
        {/* Logo Header */}
        <div className="text-center mb-3">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
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
          <h1 className="text-2xl font-bold text-white mt-2 mb-1">
            Create Your Account
          </h1>
          <p className="text-sm text-[#FFDC5F]">
            Join UniNav to navigate your admission journey
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-[#FFFDF0] rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[#001840] font-semibold text-sm">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102A71]" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                  required
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid md:grid-cols-2 gap-3.5">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[#001840] font-semibold text-sm">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102A71]" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid md:grid-cols-2 gap-3.5">
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
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
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

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[#001840] font-semibold text-sm"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#102A71]" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-10 border-[#102A71]/30 focus:border-[#102A71] focus:ring-[#102A71] text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#102A71] hover:text-[#001840] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#102A71] text-[#102A71] focus:ring-[#102A71] mt-0.5 shrink-0"
              />
              <label htmlFor="terms" className="text-xs text-[#001840] leading-tight">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-[#102A71] hover:text-[#001840] font-semibold transition-colors"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-[#102A71] hover:text-[#001840] font-semibold transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-10 bg-[#102A71] hover:bg-[#001840] text-white font-semibold text-sm transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-[#001840]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#102A71] hover:text-[#001840] font-semibold transition-colors"
              >
                Sign in here
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