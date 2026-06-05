import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  OperatorAuthProvider,
  useOperatorAuth,
} from "./context/OperatorAuthContext";
import Sidebar from "./components/Sidebar";
import OperatorSidebar from "./components/OperatorSidebar";
import Header from "./components/Header";

// ── Admin pages ───────────────────────────────────────────────────────────────
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Banners from "./pages/Banners";
import Categories from "./pages/Categories";
import Packages from "./pages/Packages";
import Templates from "./pages/Templates";
import Listings from "./pages/Listings";
import Wishlists from "./pages/Wishlists";
import MyTrips from "./pages/MyTrips";
import Bookings from "./pages/Bookings";
import UserList from "./pages/UserList";
import Reels from "./pages/Reels";
import Operators from "./pages/Operators";
import OperatorDetail from "./pages/OperatorDetail";
import TripBookings from "./pages/TripBookings";
import PlatformSettings from "./pages/PlatformSettings";
import OperatorWallets from "./pages/OperatorWallets";
import RevenueDashboard from "./pages/RevenueDashboard";
import CancellationSlabs from "./pages/CancellationSlabs";
import Reports from "./pages/Reports";

// ── Operator pages ────────────────────────────────────────────────────────────
import OperatorRegister from "./pages/operator/Register";
import OperatorOnboarding from "./pages/operator/Onboarding";
import OperatorStatus from "./pages/operator/Status";
import OperatorDashboard from "./pages/operator/Dashboard";
import OperatorPackages from "./pages/operator/Packages";
import OperatorListings from "./pages/operator/Listings";
import OperatorBatches from "./pages/operator/Batches";
import OperatorBookings from "./pages/operator/Bookings";
import OperatorWallet from "./pages/operator/Wallet";
import OperatorCoupons from "./pages/operator/Coupons";
import OperatorReviews from "./pages/operator/Reviews";

// ── Spinner helper ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Admin route guard ─────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    );
  }
  return children;
}

// ── Operator route guard ──────────────────────────────────────────────────────
function OperatorRoute({ children, requireApproved = false }) {
  const { operator, operatorLoading } = useOperatorAuth();
  if (operatorLoading) return <Spinner />;
  if (!operator) return <Navigate to="/login" replace />;
  if (requireApproved && operator.onboardingState !== "APPROVED") {
    return <Navigate to="/operator/status" replace />;
  }
  return children;
}

// ── Admin layout: dark sidebar (teal accent) + top header ────────────────────
function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-primary-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Operator layout: dark sidebar (teal accent) + mobile hamburger ────────────
function OperatorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50">
      <OperatorSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-800">TripReel Operator</span>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Root app ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OperatorAuthProvider>
          <Routes>
            {/* ── Unified login (public) ── */}
            <Route path="/login" element={<Login />} />

            {/* ── Operator login redirects to unified login ── */}
            <Route
              path="/operator/login"
              element={<Navigate to="/login" replace />}
            />

            {/* ── Operator register (public) ── */}
            <Route path="/operator/register" element={<OperatorRegister />} />

            {/* ── Operator pages (onboarding/status — no sidebar) ── */}
            <Route
              path="/operator/onboarding"
              element={
                <OperatorRoute>
                  <OperatorOnboarding />
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/status"
              element={
                <OperatorRoute>
                  <OperatorStatus />
                </OperatorRoute>
              }
            />

            {/* ── Operator pages (approved — with sidebar) ── */}
            <Route
              path="/operator/dashboard"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorDashboard />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/packages"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorPackages />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/listings"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorListings />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/batches"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorBatches />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/bookings"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorBookings />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/wallet"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorWallet />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/coupons"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorCoupons />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />
            <Route
              path="/operator/reviews"
              element={
                <OperatorRoute requireApproved>
                  <OperatorLayout>
                    <OperatorReviews />
                  </OperatorLayout>
                </OperatorRoute>
              }
            />

            {/* ── Admin pages (with AdminSidebar + Header) ── */}
            <Route
              path="/*"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                      />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/banners" element={<Banners />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/packages" element={<Packages />} />
                      <Route path="/templates" element={<Templates />} />
                      <Route path="/listings" element={<Listings />} />
                      <Route path="/reels" element={<Reels />} />
                      <Route path="/wishlists" element={<Wishlists />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/my-trips" element={<MyTrips />} />
                      <Route path="/users" element={<UserList />} />
                      <Route path="/operators" element={<Operators />} />
                      <Route
                        path="/operators/:id"
                        element={<OperatorDetail />}
                      />
                      <Route path="/trip-bookings" element={<TripBookings />} />
                      <Route
                        path="/platform-settings"
                        element={<PlatformSettings />}
                      />
                      <Route path="/revenue" element={<RevenueDashboard />} />
                      <Route
                        path="/cancellation-slabs"
                        element={<CancellationSlabs />}
                      />
                      <Route path="/reports" element={<Reports />} />
                      <Route
                        path="/operator-wallets"
                        element={<OperatorWallets />}
                      />
                      <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                      />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              }
            />
          </Routes>
        </OperatorAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
