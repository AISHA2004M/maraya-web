/**
 * Vite Configuration — Production Optimization
 * ==============================================
 * Implements manual chunk splitting to:
 *   1. Separate vendor libraries (cached separately by browser)
 *   2. Group code by usage frequency
 *   3. Allow granular cache invalidation
 *
 * Before: 1 chunk × 570 KB → slow first load, full cache bust on any change
 * After:  5-7 chunks, ~65-80 KB each → parallel download + stable vendor cache
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },

  build: {
    // Modern browsers only (no IE/legacy polyfills)
    target: "es2020",

    // Warn on chunks > 300 KB (was 500 KB default — tighter discipline)
    chunkSizeWarningLimit: 300,

    // Use esbuild minification (faster than terser, nearly same compression)
    minify: "esbuild",

    rollupOptions: {
      output: {
        /**
         * manualChunks Strategy:
         *
         * "vendor-core"   — React + Router: rarely changes, cached long-term
         * "vendor-query"  — TanStack Query: data fetching layer
         * "vendor-anim"   — Framer Motion: animation library
         * "vendor-icons"  — Lucide React: icon library
         * "vendor-ui"     — Remaining UI utilities (zustand, etc.)
         *
         * Page chunks are handled automatically by React.lazy() imports in router.jsx.
         * Each lazy page becomes its own chunk: home.js, shop.js, product-details.js, etc.
         */
        manualChunks(id) {
          // Core React — most stable, cached forever
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }

          // React Router
          if (id.includes("node_modules/react-router") ||
              id.includes("node_modules/@remix-run/")) {
            return "vendor-router";
          }

          // Data fetching
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }

          // Animation (heaviest vendor — isolated for lazy loading)
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-anim";
          }

          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }

          // State management
          if (id.includes("node_modules/zustand") ||
              id.includes("node_modules/immer")) {
            return "vendor-state";
          }

          // All other node_modules → single vendor chunk
          if (id.includes("node_modules/")) {
            return "vendor-misc";
          }

          // App code is split automatically by React.lazy() dynamic imports
        },

        // Deterministic file names for long-term caching
        // [hash] changes only when file content changes
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },

    // Source maps for production debugging (comment out to reduce build size)
    // sourcemap: true,

    // Reduce CSS duplication from component styles
    cssCodeSplit: true,
  },

  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@pages": "/src/pages",
      "@hooks": "/src/hooks",
      "@store": "/src/store",
      "@api": "/src/api",
    },
  },
});
