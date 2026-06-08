import AdminSidebar from "../components/sidebar/AdminSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export default function AdminLayout() {
  const { token, role } = useAuthStore((s) => ({ token: s.token, role: s.role }));
  
  if (!token || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface-bright">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
