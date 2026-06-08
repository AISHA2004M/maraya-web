import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import PartnerLayout from "./PartnerLayout";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import ProductForm from "../pages/ProductForm";
import Categories from "../pages/Categories";
import Brands from "../pages/Brands";
import Users from "../pages/Users";
import TryOnMonitor from "../pages/TryOnMonitor";
import AssetGenerator from "../pages/AssetGenerator";
import AdminLogin from "../pages/AdminLogin";
import PartnerLogin from "../pages/PartnerLogin";
import PartnerRegister from "../pages/PartnerRegister";
import BrandCMS from "../pages/BrandCMS";
import { useAuthStore } from "../store/useAuthStore";

function PartnerDashboardRedirect() {
  const brandSlug = useAuthStore((s) => s.brandSlug);
  const token = useAuthStore((s) => s.token);
  
  if (!token) {
    return <Navigate to="/partner/login" replace />;
  }
  
  return <Navigate to={`/partner/${brandSlug || "zara"}`} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/admin" replace /> },
  
  // Dashboard Redirects
  { path: "/admin/dashboard", element: <Navigate to="/admin" replace /> },
  { path: "/partner/dashboard", element: <PartnerDashboardRedirect /> },

  // Admin Routes
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "brands", element: <Brands /> },
    ],
  },
  
  // Partner Routes
  { path: "/partner/login", element: <PartnerLogin /> },
  { path: "/partner/register", element: <PartnerRegister /> },
  {
    path: "/partner/:brand_slug",
    element: <PartnerLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <Products /> },
      { path: "products/new", element: <ProductForm /> },
      { path: "products/:id/edit", element: <ProductForm /> },
      { path: "categories", element: <Categories /> },
      { path: "tryon", element: <TryOnMonitor /> },
      { path: "asset-generator", element: <AssetGenerator /> },
      { path: "cms", element: <BrandCMS /> },
    ],
  },
  
  // Fallback
  { path: "*", element: <PartnerLogin /> },
]);
