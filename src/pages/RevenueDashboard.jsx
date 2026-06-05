import { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  Users,
  Briefcase,
  Package,
  CalendarCheck,
  XCircle,
  BarChart3,
  Award,
} from "lucide-react";
import { revenueAPI } from "../services/api";

const formatMoney = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function RevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await revenueAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-3 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalPlatformEarnings: platformEarnings = 0,
    totalOperatorPayouts: operatorPayouts = 0,
    totalRefunds = 0,
    thisMonthRevenue = 0,
    thisMonthPlatformFee = 0,
    revenueGrowth = 0,
    monthlyRevenue = [],
    topOperators = [],
    totalUsers = 0,
    totalOperators = 0,
    totalPackages = 0,
    totalBookings = 0,
    totalCancellations = 0,
  } = data?.data || data || {};

  const thisMonth = {
    revenue: thisMonthRevenue,
    platformFee: thisMonthPlatformFee,
    growth: revenueGrowth,
  };
  const counts = {
    users: totalUsers,
    operators: totalOperators,
    packages: totalPackages,
    bookings: totalBookings,
    cancellations: totalCancellations,
  };

  const mainStats = [
    {
      label: "Total Revenue",
      value: formatMoney(totalRevenue),
      icon: IndianRupee,
      color: "bg-teal-500",
      bgLight: "bg-teal-50",
    },
    {
      label: "Platform Earnings",
      value: formatMoney(platformEarnings),
      icon: Wallet,
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
    },
    {
      label: "Operator Payouts",
      value: formatMoney(operatorPayouts),
      icon: Briefcase,
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
    },
    {
      label: "Total Refunds",
      value: formatMoney(totalRefunds),
      icon: XCircle,
      color: "bg-red-500",
      bgLight: "bg-red-50",
    },
  ];

  const summaryCards = [
    {
      label: "Total Users",
      value: counts.users || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Operators",
      value: counts.operators || 0,
      icon: Briefcase,
      color: "text-purple-600",
    },
    {
      label: "Packages",
      value: counts.packages || 0,
      icon: Package,
      color: "text-amber-600",
    },
    {
      label: "Bookings",
      value: counts.bookings || 0,
      icon: CalendarCheck,
      color: "text-teal-600",
    },
    {
      label: "Cancellations",
      value: counts.cancellations || 0,
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Revenue Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Track platform revenue, payouts, and financial metrics
          </p>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* This Month */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">This Month</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
            <p className="text-xs text-teal-600 font-medium mb-1">Revenue</p>
            <p className="text-xl font-bold text-teal-800">
              {formatMoney(thisMonth.revenue || 0)}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">
              Platform Fee
            </p>
            <p className="text-xl font-bold text-emerald-800">
              {formatMoney(thisMonth.platformFee || 0)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-1">
              Growth vs Last Month
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-gray-800">
                {thisMonth.growth >= 0 ? "+" : ""}
                {thisMonth.growth || 0}%
              </p>
              {(thisMonth.growth || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">
            Monthly Revenue (Last 6 Months)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Month", "Revenue", "Platform Fee", "Bookings"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyRevenue.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    No monthly data available
                  </td>
                </tr>
              ) : (
                monthlyRevenue.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {row.month}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatMoney(row.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatMoney(row.platformFee || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {row.bookings || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 Operators */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">
            Top 5 Operators by Revenue
          </h2>
        </div>
        <div className="p-6">
          {topOperators.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No operator data available
            </p>
          ) : (
            <div className="space-y-3">
              {topOperators.slice(0, 5).map((op, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {op.businessName || op.name || "Unknown"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-teal-700">
                    {formatMoney(op.revenue || 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Counts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-semibold text-gray-800">
            Platform Summary
          </h2>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-2xl font-bold text-gray-800">
                  {item.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
