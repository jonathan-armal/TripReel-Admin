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
} from "lucide-react";
import { useOperatorAuth } from "../context/OperatorAuthContext";

export default function OperatorSidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, logout } = useOperatorAuth();

  const isApproved = operator?.onboardingState === "APPROVED";

  const menuItems = isApproved
    ? [
        { id: "operator/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "operator/packages", label: "My Packages", icon: Package },
        { id: "operator/batches", label: "Manage Batches", icon: Calendar },
        { id: "operator/coupons", label: "Coupons", icon: Tag },
        { id: "operator/bookings", label: "Bookings", icon: ClipboardList },
        { id: "operator/wallet", label: "My Wallet", icon: Wallet },
        { id: "operator/reviews", label: "Reviews", icon: Star },
        { id: "operator/listings", label: "My Listings", icon: Layers },
      ]
    : [{ id: "operator/status", label: "Application Status", icon: Clock }];

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
  };

  const isActive = (id) => location.pathname === `/${id}`;

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
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
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
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive(item.id)
                        ? "bg-teal-500 text-white"
                        : "hover:bg-sidebar-accent text-gray-300 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {initials}
              </span>
            </div>
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
