import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  Plane,
  X,
  Clock,
  Calendar,
  Wallet,
  Layers,
  Tag,
  Star,
  Heart,
  UserCircle,
  MessageCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useOperatorAuth } from "../context/OperatorAuthContext";
import { sidebarCountsAPI } from "../services/api";

export default function OperatorSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, logout } = useOperatorAuth();

  const isApproved =
    operator?.onboardingState === "APPROVED" ||
    operator?.onboardingState === "ACTIVE_FULL";
  const isSuspended = operator?.onboardingState === "SUSPENDED";

  const [expandedGroups, setExpandedGroups] = useState({
    packages: true,
    bookings: false,
    communication: false,
    insights: false,
    account: false,
  });

  const [badgeCounts, setBadgeCounts] = useState({});

  const fetchCounts = useCallback(async () => {
    if (!isApproved) return;
    try {
      const res = await sidebarCountsAPI.getOperator();
      setBadgeCounts(res.data.counts || {});
    } catch {}
  }, [isApproved]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const getSidebarGroups = () => {
    if (isApproved) {
      return [
        {
          id: "dashboard",
          type: "single",
          item: {
            id: "operator/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
        },
        {
          id: "packages",
          type: "group",
          label: "Packages",
          icon: Package,
          items: [
            { id: "operator/packages", label: "My Packages", icon: Package },
            {
              id: "operator/batches",
              label: "Manage Batches",
              icon: Calendar,
            },
            { id: "operator/coupons", label: "Coupons", icon: Tag },
          ],
        },
        {
          id: "bookings",
          type: "group",
          label: "Bookings & Earnings",
          icon: ClipboardList,
          items: [
            {
              id: "operator/bookings",
              label: "Bookings",
              icon: ClipboardList,
              badgeKey: "newBookings",
            },
            { id: "operator/wallet", label: "My Wallet", icon: Wallet },
            {
              id: "operator/analytics",
              label: "Booking Management",
              icon: BarChart3,
            },
          ],
        },
        {
          id: "communication",
          type: "group",
          label: "Communication",
          icon: MessageCircle,
          items: [
            {
              id: "operator/messages",
              label: "Messages",
              icon: MessageCircle,
            },
            {
              id: "operator/notifications",
              label: "Notifications",
              icon: Bell,
              badgeKey: "unreadNotifications",
            },
          ],
        },
        {
          id: "insights",
          type: "group",
          label: "Insights",
          icon: Star,
          items: [
            { id: "operator/reviews", label: "Reviews", icon: Star },
            { id: "operator/wishlists", label: "Wishlists", icon: Heart },
          ],
        },
        {
          id: "account",
          type: "group",
          label: "Account",
          icon: UserCircle,
          items: [
            { id: "operator/profile", label: "My Profile", icon: UserCircle },
            { id: "operator/listings", label: "My Listings", icon: Layers },
          ],
        },
      ];
    }

    if (isSuspended) {
      return [
        {
          id: "status",
          type: "single",
          item: {
            id: "operator/status",
            label: "Account Status",
            icon: Clock,
          },
        },
        {
          id: "notifications",
          type: "single",
          item: {
            id: "operator/notifications",
            label: "Notifications",
            icon: Bell,
          },
        },
      ];
    }

    return [
      {
        id: "status",
        type: "single",
        item: {
          id: "operator/status",
          label: "Application Status",
          icon: Clock,
        },
      },
    ];
  };

  const sidebarGroups = getSidebarGroups();

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const initials = operator?.contactName
    ? operator.contactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "OP";

  const handleClick = (id) => {
    navigate(`/${id}`);
    setSidebarOpen(false);

    // Mark section as seen to clear badge
    const sectionMap = {
      "operator/bookings": "bookings",
      "operator/notifications": "notifications",
    };
    if (sectionMap[id]) {
      sidebarCountsAPI
        .markOperatorSeen(sectionMap[id])
        .then(fetchCounts)
        .catch(() => {});
    }
  };

  const isActive = (id) => location.pathname === `/${id}`;

  // Auto-expand the group containing the active route
  const activeGroupId = sidebarGroups.find(
    (g) => g.type === "group" && g.items?.some((item) => isActive(item.id)),
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
              <h1 className="font-bold text-lg text-white">TripReel</h1>
              <p className="text-xs text-gray-400">Operator Portal</p>
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
          {!isApproved && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
              Your account is pending admin approval. Dashboard access will be
              unlocked once approved.
            </div>
          )}
          <ul className="space-y-1">
            {sidebarGroups.map((group) => {
              if (group.type === "single") {
                const Icon = group.item.icon;
                return (
                  <li key={group.id}>
                    <button
                      onClick={() => handleClick(group.item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive(group.item.id)
                          ? "bg-teal-500 text-white"
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
                        ? "text-teal-400"
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
                              onClick={() => handleClick(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                isActive(item.id)
                                  ? "bg-teal-500 text-white"
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

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            {operator?.profilePhoto ? (
              <img
                src={
                  operator.profilePhoto.startsWith("http")
                    ? operator.profilePhoto
                    : (window.location.hostname === "localhost"
                        ? "http://localhost:5001"
                        : "https://tripreel-backend.onrender.com") +
                      operator.profilePhoto
                }
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {initials}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm text-white truncate">
                {operator?.businessName || operator?.contactName || "Operator"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {operator?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
