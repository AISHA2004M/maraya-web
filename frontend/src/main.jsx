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

// ─── Query Client Configuration ───────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults — overridden per-query in hooks/useProducts.js
      staleTime: 1000 * 60 * 10,   // 10 minutes: data is fresh for 10 min
      gcTime: 1000 * 60 * 30,      // 30 minutes: remove from memory if unused
      retry: 2,                     // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
      refetchOnWindowFocus: false,  // Don't refetch when user tabs back (fashion data is stable)
      refetchOnReconnect: true,     // Do refetch on network reconnect
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
