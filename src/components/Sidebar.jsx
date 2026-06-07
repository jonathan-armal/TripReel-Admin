import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Image,
  Package,
  Heart,
  Users,
  X,
  Plane,
  Tag,
  Video,
  Building2,
  Layers,
  ClipboardList,
  CalendarCheck,
  Settings,
  Wallet,
  BarChart3,
  AlertTriangle,
  Percent,
  Bell,
  Megaphone,
  ChevronDown,
  ChevronRight,
  MapPin,
  Compass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sidebarCountsAPI } from "../services/api";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [expandedGroups, setExpandedGroups] = useState({
    content: true,
    packages: false,
    bookings: false,
    users: false,
    settings: false,
  });

  const [badgeCounts, setBadgeCounts] = useState({});

  const fetchCounts = useCallback(async () => {
    try {
      const res = await sidebarCountsAPI.getAdmin();
      setBadgeCounts(res.data.counts || {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const sidebarGroups = [
    {
      id: "dashboard",
      type: "single",
      item: { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    },
    {
      id: "content",
      type: "group",
      label: "Content Management",
      icon: Layers,
      items: [
        { id: "banners", label: "Banners", icon: Image },
        { id: "categories", label: "Categories", icon: Tag },
        { id: "templates", label: "Templates", icon: Layers },
        { id: "listings", label: "Listings", icon: ClipboardList },
        { id: "reels", label: "Reels", icon: Video },
        { id: "experiences", label: "Experiences", icon: Compass },
        {
          id: "popular-destinations",
          label: "Popular Destinations",
          icon: MapPin,
        },
      ],
    },
    {
      id: "packages",
      type: "group",
      label: "Package Management",
      icon: Package,
      items: [
        {
          id: "packages",
          label: "Package Review",
          icon: Package,
          badgeKey: "pendingPackages",
        },
        {
          id: "cancellation-slabs",
          label: "Cancellation Slabs",
          icon: Percent,
        },
      ],
    },
    {
      id: "bookings",
      type: "group",
      label: "Bookings & Revenue",
      icon: CalendarCheck,
      items: [
        {
          id: "trip-bookings",
          label: "Trip Bookings",
          icon: CalendarCheck,
          badgeKey: "newBookings",
        },
        { id: "revenue", label: "Revenue", icon: BarChart3 },
        { id: "operator-wallets", label: "Operator Wallets", icon: Wallet },
      ],
    },
    {
      id: "users",
      type: "group",
      label: "Users & Operators",
      icon: Users,
      items: [
        { id: "users", label: "User List", icon: Users },
        {
          id: "operators",
          label: "Operators",
          icon: Building2,
          badgeKey: "pendingOperators",
        },
        { id: "wishlists", label: "Wishlists", icon: Heart },
        { id: "reports", label: "User Reports", icon: AlertTriangle },
      ],
    },
    {
      id: "settings",
      type: "group",
      label: "Settings",
      icon: Settings,
      items: [
        { id: "platform-settings", label: "Platform Settings", icon: Settings },
        { id: "broadcast", label: "Broadcast", icon: Megaphone },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          badgeKey: "unreadNotifications",
        },
      ],
    },
  ];

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleMenuClick = (id) => {
    navigate(`/${id}`);
    setSidebarOpen(false);

    // Mark section as seen to clear badge
    const sectionMap = {
      packages: "packages",
      "trip-bookings": "trip-bookings",
      operators: "operators",
      notifications: "notifications",
    };
    if (sectionMap[id]) {
      sidebarCountsAPI
        .markAdminSeen(sectionMap[id])
        .then(fetchCounts)
        .catch(() => {});
    }
  };

  const isActive = (id) => location.pathname === `/${id}`;

  // Auto-expand the group containing the active route
  const activeGroupId = sidebarGroups.find(
    (g) => g.type === "group" && g.items.some((item) => isActive(item.id)),
  )?.id;

  if (activeGroupId && !expandedGroups[activeGroupId]) {
    setExpandedGroups((prev) => ({ ...prev, [activeGroupId]: true }));
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/tripreellogo.png"
              alt="TripReel"
              className="h-8 w-auto"
            />
            <div>
              <h1 className="font-bold text-lg">TripReel</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          <button
            className="lg:hidden p-1 hover:bg-sidebar-accent rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarGroups.map((group) => {
              if (group.type === "single") {
                const Icon = group.item.icon;
                return (
                  <li key={group.id}>
                    <button
                      onClick={() => handleMenuClick(group.item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(group.item.id)
                          ? "bg-primary-500 text-white"
                          : "hover:bg-sidebar-accent text-gray-300 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{group.item.label}</span>
                    </button>
                  </li>
                );
              }

              const GroupIcon = group.icon;
              const isExpanded = expandedGroups[group.id];
              const hasActiveChild = group.items.some((item) =>
                isActive(item.id),
              );

              return (
                <li key={group.id} className="pt-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      hasActiveChild
                        ? "text-primary-400"
                        : "text-gray-400 hover:bg-sidebar-accent hover:text-white"
                    }`}
                  >
                    <GroupIcon className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider flex-1 text-left">
                      {group.label}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <ul className="mt-1 ml-3 space-y-0.5 border-l border-sidebar-border pl-3">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const badge = item.badgeKey
                          ? badgeCounts[item.badgeKey]
                          : 0;
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handleMenuClick(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                isActive(item.id)
                                  ? "bg-primary-500 text-white"
                                  : "hover:bg-sidebar-accent text-gray-300 hover:text-white"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="flex-1 text-left">
                                {item.label}
                              </span>
                              {badge > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                                  {badge > 99 ? "99+" : badge}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Admin footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
