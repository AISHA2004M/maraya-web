import PartnerSidebar from "../components/sidebar/PartnerSidebar";
import { Outlet, Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function PartnerLayout() {
  const { brand_slug } = useParams();
  const { token, role, brandSlug } = useAuthStore((s) => ({
    token: s.token,
    role: s.role,
    brandSlug: s.brandSlug,
  }));
  const isAllowed = role === "partner" || role === "admin";

  // Enforce brand slug alignment if logged in as partner
  if (token && role === "partner" && brandSlug && brandSlug !== brand_slug) {
    return <Navigate to={`/partner/${brandSlug}`} replace />;
  }

  if (!token || !isAllowed) {
    return <Navigate to="/partner/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface-bright">
      <PartnerSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
