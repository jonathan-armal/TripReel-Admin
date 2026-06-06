import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  Plane,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  Building2,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOperatorAuth } from "../context/OperatorAuthContext";

function InputField({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  rightSlot,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
        />
        {rightSlot}
      </div>
    </div>
  );
}

export default function Login() {
  const { login: adminLogin, user } = useAuth();
  const { login: operatorLogin, operator, operatorLoading } = useOperatorAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("admin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect immediately
  if (user && user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  if (!operatorLoading && operator) {
    if (operator.onboardingState === "APPROVED") {
      return <Navigate to="/operator/dashboard" replace />;
    } else if (operator.onboardingState === "DRAFT") {
      return <Navigate to="/operator/onboarding" replace />;
    } else {
      return <Navigate to="/operator/status" replace />;
    }
  }

  const handleTabSwitch = (t) => {
    setTab(t);
    setError("");
    setForm({ email: "", password: "" });
    setShowPwd(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "admin") {
        const user = await adminLogin(form.email, form.password);
        if (user.role !== "admin") {
          setError("Access denied. Admin accounts only.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }
        navigate("/dashboard", { replace: true });
      } else {
        const op = await operatorLogin(form.email, form.password);
        if (op.onboardingState === "APPROVED") {
          navigate("/operator/dashboard", { replace: true });
        } else if (op.onboardingState === "DRAFT") {
          navigate("/operator/onboarding", { replace: true });
        } else {
          navigate("/operator/status", { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2231] via-[#1a3347] to-[#0f2231] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TripReel</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tab === "admin" ? "Admin Panel" : "Operator Portal"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => handleTabSwitch("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                tab === "admin"
                  ? "text-teal-600 border-b-2 border-teal-500 bg-teal-50/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin
            </button>
            <button
              onClick={() => handleTabSwitch("operator")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                tab === "operator"
                  ? "text-teal-600 border-b-2 border-teal-500 bg-teal-50/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Operator
            </button>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {tab === "admin"
                ? "Sign in to your admin account"
                : "Sign in to your operator account"}
            </p>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Email address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder={
                  tab === "admin"
                    ? "admin@tripreel.com"
                    : "operator@company.com"
                }
              />

              <InputField
                label="Password"
                icon={Lock}
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder="••••••••"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md shadow-teal-500/30 mt-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {tab === "operator" && (
              <p className="text-center text-sm text-gray-500 mt-6">
                Don&apos;t have an account?{" "}
                <Link
                  to="/operator/register"
                  className="text-teal-600 font-medium hover:underline"
                >
                  Register here
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
