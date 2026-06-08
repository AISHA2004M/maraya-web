import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Users, Sparkles,
  Tag, Building2, LogOut, ExternalLink, Image
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export default function PartnerSidebar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const brandSlug = useAuthStore((s) => s.brandSlug) || "zara";

  const navItems = [
    { to: `/partner/${brandSlug}`, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: `/partner/${brandSlug}/products`, label: "Products", icon: Package },
    { to: `/partner/${brandSlug}/categories`, label: "Categories", icon: Tag },
    { to: `/partner/${brandSlug}/tryon`, label: "AI Try-On", icon: Sparkles },
    { to: `/partner/${brandSlug}/asset-generator`, label: "AI Generator", icon: Image },
    { to: `/partner/${brandSlug}/cms`, label: "Brand CMS", icon: Building2 },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#111111] border-r border-[#222222] flex flex-col font-sans">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-white" />
          <div>
            <span className="font-bold text-lg text-white tracking-wide">VRITAL</span>
            <p className="text-[9px] text-[#888888] font-bold uppercase tracking-[0.2em] mt-1">Partner Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => {
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
          href={`http://localhost:5173/brands/${brandSlug}`}
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
