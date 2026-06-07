import { useState, useEffect } from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { notificationsAdminAPI } from "../services/api";

function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [bellNotifs, setBellNotifs] = useState([]);
  const [bellUnread, setBellUnread] = useState(0);

  useEffect(() => {
    notificationsAdminAPI
      .getMy()
      .then((res) => {
        setBellNotifs((res.data?.notifications || []).slice(0, 5));
        setBellUnread(res.data?.unreadCount || 0);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-gray-800">TripReel Admin</p>
          <p className="text-xs text-gray-400">Manage your travel platform</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Bell with dropdown */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {bellUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {bellUnread > 9 ? "9+" : bellUnread}
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setBellOpen(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    Notifications
                  </p>
                  {bellUnread > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {bellUnread} new
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {bellNotifs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      No notifications
                    </p>
                  ) : (
                    bellNotifs.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read ? "bg-teal-50/40" : ""}`}
                      >
                        <p
                          className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-gray-800 truncate`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {n.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate("/notifications");
                  }}
                  className="w-full px-4 py-3 text-center text-sm font-medium text-teal-600 hover:bg-teal-50 border-t border-gray-100 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-500"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
