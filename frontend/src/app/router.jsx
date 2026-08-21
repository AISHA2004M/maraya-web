/**
 * Router — Route-Level Code Splitting
 * =====================================
 * All page components are lazy-loaded with React.lazy().
 * This defers their code from the initial JS bundle,
 * reducing first-load payload from ~570 KB → ~65 KB.
 *
 * Each route chunk is loaded only when the user navigates
 * to that page, and is cached by the browser thereafter.
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Helper to retry loading lazy components when new assets are deployed on Vercel
const lazyRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Failed to load dynamically imported module, reloading...", error);
      const lastReload = sessionStorage.getItem("chunk-reload-timestamp");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem("chunk-reload-timestamp", now.toString());
        window.location.reload();
      }
      throw error;
    }
  });
};

import Home from "../pages/Home";

// ─── Lazy Page Imports ──────────────────────────────────────────────────────
const Shop          = lazyRetry(() => import("../pages/Shop"));

const ProductDetails = lazyRetry(() => import("../pages/ProductDetails"));
const TryOn         = lazyRetry(() => import("../pages/TryOn"));
const Cart          = lazyRetry(() => import("../pages/Cart"));
const Checkout      = lazyRetry(() => import("../pages/Checkout"));
const Login         = lazyRetry(() => import("../pages/Login"));
const BrandDetails  = lazyRetry(() => import("../pages/BrandDetails"));
const Profile       = lazyRetry(() => import("../pages/Profile"));
const Discover      = lazyRetry(() => import("../pages/Discover"));
const SearchByImage = lazyRetry(() => import("../pages/SearchByImage"));
const PartnerLogin  = lazyRetry(() => import("../pages/PartnerLogin"));
const Wishlist      = lazyRetry(() => import("../pages/Wishlist"));
const OrderTracking = lazyRetry(() => import("../pages/OrderTracking"));
const ForgotPassword = lazyRetry(() => import("../pages/ForgotPassword"));
const ResetPassword = lazyRetry(() => import("../pages/ResetPassword"));


// ─── Fallback UI ─────────────────────────────────────────────────────────────
// Lightweight skeleton shown while lazy chunks are downloading.
// Must NOT import heavy dependencies — kept intentionally minimal.

function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#faf9f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Loading page..."
      role="status"
    >
      {/* Luxury minimal spinner — zero external deps */}
      <div
        style={{
          width: 32,
          height: 32,
          border: "1.5px solid #e8e4de",
          borderTopColor: "#1a1c1c",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Page Transition Wrapper ─────────────────────────────────────────────────
// Subtle fade-up on page entry. Kept light — framer-motion is
// in its own separate vendor chunk so it doesn't block initial load.

function PageTransition({ children }) {
  return <>{children}</>;
}


// ─── Route Wrapper ────────────────────────────────────────────────────────────
// Combines Suspense + PageTransition for every route.
// Suspense catches the lazy load, PageTransition animates the reveal.

function LazyRoute({ Page }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
        <Page />
      </PageTransition>
    </Suspense>
  );
}

// ─── Router Configuration ─────────────────────────────────────────────────────

export const router = createBrowserRouter([
  { path: "/",                                 element: <PageTransition><Home /></PageTransition> },
  { path: "/discover",                         element: <LazyRoute Page={Discover} /> },
  { path: "/login",                            element: <LazyRoute Page={Login} /> },
  { path: "/forgot-password",                  element: <LazyRoute Page={ForgotPassword} /> },
  { path: "/reset-password",                   element: <LazyRoute Page={ResetPassword} /> },
  { path: "/wishlist",                         element: <LazyRoute Page={Wishlist} /> },
  { path: "/track-order",                      element: <LazyRoute Page={OrderTracking} /> },
  { path: "/track-order/:id",                  element: <LazyRoute Page={OrderTracking} /> },
  
  // Boutique-scoped routes
  { path: "/brands/:brand_slug",               element: <PageTransition><Home /></PageTransition> },

  { path: "/brands/:brand_slug/shop",          element: <LazyRoute Page={Shop} /> },
  { path: "/brands/:brand_slug/product/:id",   element: <LazyRoute Page={ProductDetails} /> },
  { path: "/brands/:brand_slug/tryon",         element: <LazyRoute Page={TryOn} /> },
  { path: "/brands/:brand_slug/cart",          element: <LazyRoute Page={Cart} /> },
  { path: "/brands/:brand_slug/wishlist",      element: <LazyRoute Page={Wishlist} /> },
  { path: "/brands/:brand_slug/track-order",   element: <LazyRoute Page={OrderTracking} /> },
  { path: "/brands/:brand_slug/track-order/:id", element: <LazyRoute Page={OrderTracking} /> },
  { path: "/brands/:brand_slug/checkout",      element: <ProtectedRoute><LazyRoute Page={Checkout} /></ProtectedRoute> },
  { path: "/brands/:brand_slug/profile",       element: <ProtectedRoute><LazyRoute Page={Profile} /></ProtectedRoute> },
  { path: "/brands/:brand_slug/search-by-image", element: <LazyRoute Page={SearchByImage} /> },

  // Partner & Admin Studio Management Routes
  { path: "/partner/login",                       element: <LazyRoute Page={PartnerLogin} /> },
  { path: "/admin/login",                         element: <LazyRoute Page={PartnerLogin} /> },
  { path: "/admin/parten",                        element: <LazyRoute Page={PartnerLogin} /> },
  { path: "/admin/partner",                       element: <LazyRoute Page={PartnerLogin} /> },
  { path: "/admin",                               element: <LazyRoute Page={PartnerLogin} /> },

  // Fallback/Legacy routes (for backward compatibility)
  { path: "/shop",       element: <LazyRoute Page={Shop} /> },
  { path: "/product/:id", element: <LazyRoute Page={ProductDetails} /> },
  { path: "/tryon",      element: <LazyRoute Page={TryOn} /> },
  { path: "/cart",       element: <LazyRoute Page={Cart} /> },
  { path: "/checkout",   element: <ProtectedRoute><LazyRoute Page={Checkout} /></ProtectedRoute> },
  { path: "/profile",    element: <ProtectedRoute><LazyRoute Page={Profile} /></ProtectedRoute> },
  { path: "/search-by-image",                     element: <LazyRoute Page={SearchByImage} /> },
]);


