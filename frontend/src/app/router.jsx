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
import { createBrowserRouter } from "react-router-dom";
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

// ─── Lazy Page Imports ──────────────────────────────────────────────────────
const Home          = lazyRetry(() => import("../pages/Home"));
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
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
  { path: "/",                       element: <LazyRoute Page={Discover} /> },
  { path: "/discover",               element: <LazyRoute Page={Discover} /> },
  { path: "/login",                  element: <LazyRoute Page={Login} /> },
  
  // Boutique-scoped routes
  { path: "/brands/:brand_slug",               element: <LazyRoute Page={Home} /> },
  { path: "/brands/:brand_slug/shop",          element: <LazyRoute Page={Shop} /> },
  { path: "/brands/:brand_slug/product/:id",   element: <LazyRoute Page={ProductDetails} /> },
  { path: "/brands/:brand_slug/tryon",         element: <LazyRoute Page={TryOn} /> },
  { path: "/brands/:brand_slug/cart",          element: <LazyRoute Page={Cart} /> },
  { path: "/brands/:brand_slug/checkout",      element: <ProtectedRoute><LazyRoute Page={Checkout} /></ProtectedRoute> },
  { path: "/brands/:brand_slug/profile",       element: <ProtectedRoute><LazyRoute Page={Profile} /></ProtectedRoute> },
  { path: "/brands/:brand_slug/search-by-image", element: <LazyRoute Page={SearchByImage} /> },

  // Fallback/Legacy routes (for backward compatibility)
  { path: "/shop",       element: <LazyRoute Page={Shop} /> },
  { path: "/product/:id", element: <LazyRoute Page={ProductDetails} /> },
  { path: "/tryon",      element: <LazyRoute Page={TryOn} /> },
  { path: "/cart",       element: <LazyRoute Page={Cart} /> },
  { path: "/checkout",   element: <ProtectedRoute><LazyRoute Page={Checkout} /></ProtectedRoute> },
  { path: "/profile",    element: <ProtectedRoute><LazyRoute Page={Profile} /></ProtectedRoute> },
  { path: "/search-by-image",                     element: <LazyRoute Page={SearchByImage} /> },
]);
