/**
 * React Entry Point — Enterprise Configuration
 * =============================================
 * - React Query: production cache tuning for fashion catalog data
 * - HelmetProvider: enables dynamic SEO meta tags per-page (like Zara/ASOS)
 * - Sentry: frontend error tracking (enabled when VITE_SENTRY_DSN is set)
 * - Render warmup: pings backend to wake Render free tier from sleep
 *
 * Query Cache Strategy:
 *   Products:   10 min stale, 60 min in-memory
 *   Brands:      1 hr stale, 60 min in-memory
 *   Categories:  2 hr stale, 60 min in-memory
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { router } from "./app/router";
import "./styles/index.css";

// ─── Sentry Frontend Error Tracking ──────────────────────────────────────────
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN && import.meta.env.PROD) {
  import("@sentry/react").then(({ init, browserTracingIntegration }) => {
    init({
      dsn: SENTRY_DSN,
      environment: "production",
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  });
}

// ─── PWA Service Worker Cache Busting ───────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}


// ─── Render Warmup Ping ────────────────────────────────────────────────────────

// The Render free tier sleeps after 15min of inactivity.
// We fire a lightweight ping immediately on app load so the server wakes
// up in the background while the user sees the page with fallback data.
const RENDER_BASE = import.meta.env.VITE_API_URL || "https://vrital-api.onrender.com";

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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
