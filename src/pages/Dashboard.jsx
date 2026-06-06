import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  Package,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  CalendarCheck,
  XCircle,
  Wallet,
  Star,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { revenueAPI, adminTripBookingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      revenueAPI.getDashboard(),
      adminTripBookingsAPI.getAll({ limit: 5 }),
    ])
      .then(([revRes, bookRes]) => {
        setData(revRes.data?.data || revRes.data || {});
        setRecentBookings(bookRes.data?.bookings || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalPlatformEarnings = 0,
    totalOperatorPayouts = 0,
    totalRefunds = 0,
    thisMonthRevenue = 0,
    thisMonthPlatformFee = 0,
    revenueGrowth = 0,
    monthlyRevenue = [],
    totalUsers = 0,
    totalOperators = 0,
    totalPackages = 0,
    totalBookings = 0,
    totalCancellations = 0,
    topOperators = [],
  } = data || {};

  const statCards = [
    {
      label: "Total Revenue",
      value: fmt(totalRevenue),
      icon: IndianRupee,
      color: "bg-teal-500",
      link: "/revenue",
    },
    {
      label: "Platform Earnings",
      value: fmt(totalPlatformEarnings),
      icon: Wallet,
      color: "bg-emerald-500",
      link: "/revenue",
    },
    {
      label: "Total Bookings",
      value: totalBookings,
      icon: CalendarCheck,
      color: "bg-blue-500",
      link: "/trip-bookings",
    },
    {
      label: "Active Packages",
      value: totalPackages,
      icon: Package,
      color: "bg-amber-500",
      link: "/packages",
    },
  ];

  const secondRow = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Operators",
      value: totalOperators,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Cancellations",
      value: totalCancellations,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Refunds Issued",
      value: fmt(totalRefunds),
      icon: IndianRupee,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const getStatusColor = (status) => {
    if (status === "CONFIRMED") return "bg-green-100 text-green-700";
    if (status === "COMPLETED") return "bg-blue-100 text-blue-700";
    if (status === "CANCELLED") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
        <p className="text-teal-100 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name || "Admin"}</h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-xs text-teal-100">This Month</p>
            <p className="text-lg font-bold">{fmt(thisMonthRevenue)}</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-xs text-teal-100">Platform Fee</p>
            <p className="text-lg font-bold">{fmt(thisMonthPlatformFee)}</p>
          </div>
          <div className="bg-white/15 rounded-lg px-3 py-1.5">
            <p className="text-xs text-teal-100">Growth</p>
            <p className="text-lg font-bold flex items-center gap-1">
              {revenueGrowth >= 0 ? "+" : ""}
              {revenueGrowth}%
              {revenueGrowth >= 0 && <TrendingUp className="w-4 h-4" />}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(stat.link)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`${stat.color} p-3 rounded-lg w-fit`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-3">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {secondRow.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 text-center"
            >
              <div
                className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-800">
                {typeof item.value === "number"
                  ? item.value.toLocaleString()
                  : item.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-teal-600" />
              Recent Bookings
            </h2>
            <button
              onClick={() => navigate("/trip-bookings")}
              className="text-sm text-teal-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No bookings yet
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {b.snapshot?.packageTitle || b.packageId?.title || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.userId?.name || "User"} · {b.seats} seat
                      {b.seats > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {fmt(b.pricing?.totalAmount)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(b.status)}`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Monthly Revenue
            </h2>
            <button
              onClick={() => navigate("/revenue")}
              className="text-sm text-teal-600 hover:underline flex items-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5">
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No data yet
              </p>
            ) : (
              <div className="space-y-3">
                {monthlyRevenue.map((m, i) => {
                  const maxRev = Math.max(
                    ...monthlyRevenue.map((r) => r.revenue || 1),
                  );
                  const pct = Math.round(((m.revenue || 0) / maxRev) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <p className="text-xs text-gray-500 w-16 shrink-0">
                        {m.month}
                      </p>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-gray-700 w-20 text-right">
                        {fmt(m.revenue)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Operators */}
      {topOperators.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Top Operators by Revenue
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topOperators.slice(0, 6).map((op, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {op.businessName || op.contactName || "Operator"}
                  </p>
                  <p className="text-xs text-teal-600 font-semibold">
                    {fmt(op.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
