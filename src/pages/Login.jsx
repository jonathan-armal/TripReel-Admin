import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  Plane,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOperatorAuth } from "../context/OperatorAuthContext";

export default function Login() {
  const { user } = useAuth();
  const { login: operatorLogin, operator, operatorLoading } = useOperatorAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect
  if (user && user.role === "admin")
    return <Navigate to="/dashboard" replace />;
  if (!operatorLoading && operator) {
    if (operator.onboardingState === "APPROVED")
      return <Navigate to="/operator/dashboard" replace />;
    if (operator.onboardingState === "DRAFT")
      return <Navigate to="/operator/onboarding" replace />;
    return <Navigate to="/operator/status" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const op = await operatorLogin(form.email, form.password);
      if (op.onboardingState === "APPROVED")
        navigate("/operator/dashboard", { replace: true });
      else if (op.onboardingState === "DRAFT")
        navigate("/operator/onboarding", { replace: true });
      else navigate("/operator/status", { replace: true });
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
        <div className="text-center mb-8">
          <img
            src="/tripreellogo.png"
            alt="TripReel"
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">TripReel</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to your operator account
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-teal-500">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="operator@company.com"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-teal-500">
                <Lock className="w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-medium rounded-xl transition-colors shadow-md shadow-teal-500/30 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to="/operator/register"
              className="text-teal-600 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
