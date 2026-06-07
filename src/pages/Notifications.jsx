import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  Users,
  Star,
  CheckCheck,
} from "lucide-react";
import { notificationsAdminAPI } from "../services/api";

const TYPE_CONFIG = {
  new_booking: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  booking_cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  general: { icon: Bell, color: "text-gray-500", bg: "bg-gray-100" },
};

function fmtTime(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 172800000) return "Yesterday";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    notificationsAdminAPI
      .getMy()
      .then((res) => {
        setNotifications(res.data?.notifications || []);
        notificationsAdminAPI.markAllRead().catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    tab === "all" ? notifications : notifications.filter((n) => !n.read);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "unread"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t === "all"
              ? `All (${notifications.length})`
              : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            const Icon = config.icon;
            return (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-4 rounded-xl border ${n.read ? "bg-white border-gray-100" : "bg-teal-50/50 border-teal-100"}`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${n.read ? "font-medium" : "font-bold"} text-gray-800`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {fmtTime(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
