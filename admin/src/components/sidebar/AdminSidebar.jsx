import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, Sparkles,
  Tag, Building2, LogOut, ExternalLink,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/brands", label: "Partners & Stores", icon: Building2 },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 min-h-screen bg-[#111111] border-r border-[#222222] flex flex-col font-sans">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-white" />
          <div>
            <span className="font-bold text-lg text-white tracking-wide">VRITAL</span>
            <p className="text-[9px] text-[#888888] font-bold uppercase tracking-[0.2em] mt-1">Admin Command</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              id={`nav-${label.toLowerCase().replace(/ /g, "-")}`}
              className={`flex items-center gap-4 px-4 py-3 rounded-md text-xs font-semibold tracking-wide uppercase transition-all ${
                active
                  ? "bg-white text-black"
                  : "text-[#888888] hover:text-white hover:bg-[#222222]"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#222222] space-y-2">
        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 px-4 py-3 rounded-md text-xs font-semibold tracking-wide uppercase text-[#888888] hover:text-white hover:bg-[#222222] transition-all"
        >
          <ExternalLink size={16} />
          Storefront
        </a>
        <button
          onClick={logout}
          id="sidebar-logout"
          className="w-full flex items-center gap-4 px-4 py-3 rounded-md text-xs font-semibold tracking-wide uppercase text-[#888888] hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
