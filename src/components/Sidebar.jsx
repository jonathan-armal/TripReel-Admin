
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Image,
  Package,
  Heart,
  Briefcase,
  Users,
  X,
  Plane,
  Tag,
  Video,
  Building2,
  Layers,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "banners", label: "Banners", icon: Image },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "templates", label: "Templates", icon: Layers },
    { id: "listings", label: "Listings", icon: ClipboardList },
    { id: "packages", label: "Package Review", icon: Package },
    { id: "reels", label: "Reels", icon: Video },
  ];

  const bottomMenuItems = [
    { id: "wishlists", label: "Wishlists", icon: Heart },
    { id: "bookings", label: "Bookings", icon: Receipt },
    { id: "my-trips", label: "My Trips", icon: Briefcase },
    { id: "users", label: "User List", icon: Users },
    { id: "operators", label: "Operators", icon: Building2 },
  ];

  const handleMenuClick = (id) => {
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
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TravelAdmin</h1>
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
            {/* Main menu items */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive(item.id)
                        ? "bg-primary-500 text-white"
                        : "hover:bg-sidebar-accent text-gray-300 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}

            {/* Management section */}
            <li className="pt-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Management
              </div>
            </li>

            {bottomMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive(item.id)
                        ? "bg-primary-500 text-white"
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
