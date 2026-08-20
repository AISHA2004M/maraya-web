/**
 * React Query Configuration — Production Cache Tuning
 * ====================================================
 * Optimized staleTime and gcTime for fashion catalog data:
 *
 * staleTime: How long cached data is considered fresh (no refetch)
 * gcTime:    How long unused cache entries are kept in memory
 *
 * Fashion data categories:
 *   - Products: change on admin updates → 10 min stale, 30 min cache
 *   - Brands:   rarely change → 1 hour stale, 2 hour cache
 *   - Categories: almost never change → 2 hour stale, 4 hour cache
 *   - Sessions: user-specific, never stale for too long → 2 min stale
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./app/router";
import "./styles/index.css";

// ─── Render Warmup Ping ────────────────────────────────────────────────────────
// The Render free tier sleeps after 15min of inactivity.
// We fire a lightweight ping immediately on app load so the server wakes
// up in the background while the user sees the page with fallback data.
const RENDER_BASE = import.meta.env.VITE_API_URL || "https://vrital-api.onrender.com";

// Ping backend immediately and again after 8s (in case it needs a moment)
function warmupRenderServer() {
  const ping = () =>
    fetch(`${RENDER_BASE}/api/v1/health`, { method: "GET", mode: "cors" }).catch(() => {});
  ping();
  setTimeout(ping, 8000);
}
// Only ping in production
if (import.meta.env.PROD) {
  warmupRenderServer();
}

// ─── Query Client Configuration ───────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults — overridden per-query in hooks/useProducts.js
      staleTime: 1000 * 60 * 10,   // 10 minutes: data is fresh for 10 min
      gcTime: 1000 * 60 * 60,      // 60 minutes: keep in memory longer
      retry: 0,                     // Don't retry — use fallback data instead (no slow retry delays)
      refetchOnWindowFocus: false,  // Don't refetch when user tabs back
      refetchOnReconnect: false,    // Don't refetch on reconnect (we have fallbacks)
    },
    mutations: {
      retry: 0, // Don't retry mutations (cart additions, etc.)
    },
  },
});

// ─── App Render ───────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
