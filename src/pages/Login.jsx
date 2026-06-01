import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plane, Eye, EyeOff, LogIn, Shield, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOperatorAuth } from "../context/OperatorAuthContext";

export default function Login() {
  const { login: adminLogin } = useAuth();
  const { login: operatorLogin } = useOperatorAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("admin"); // "admin" | "operator"
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTabSwitch = (t) => {
    setTab(t);
    setError("");
    setForm({ email: "", password: "" });
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
        if (
          op.onboardingState === "ACTIVE_PROBATION" ||
          op.onboardingState === "ACTIVE_FULL"
        ) {
          navigate("/operator/dashboard", { replace: true });
        } else if (op.onboardingState === "DRAFT") {
          navigate("/operator/onboarding", { replace: true });
        } else {
          navigate("/operator/status", { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={
                    tab === "admin"
                      ? "admin@tripreel.com"
                      : "operator@company.com"
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md shadow-teal-500/30"
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

            {/* Operator register link */}
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
