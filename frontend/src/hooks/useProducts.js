/**
 * useProducts Hooks — Optimized Zero-Latency Data Hooks
 * ====================================================
 * Automatically provides instantaneous fallback catalog data while syncing in the background.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  getBrands,
  getBrandById,
  getCategories,
} from "../api/products";
// ─── Products List ─────────────────────────────────────────────────────────────
export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts({ limit: 100, ...params }),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });


// ─── Single Product ────────────────────────────────────────────────────────────
export const useProduct = (id) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

// ─── Brands ───────────────────────────────────────────────────────────────────
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

// ─── Single Brand ──────────────────────────────────────────────────────────────
export const useBrand = (id) =>
  useQuery({
    queryKey: ["brand", id],
    queryFn: () => getBrandById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
  });

// ─── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });


// ─── Prefetch Utility ──────────────────────────────────────────────────────────
export const useProductPrefetch = () => {
  const queryClient = useQueryClient();

  return (productId) => {
    queryClient.prefetchQuery({
      queryKey: ["product", productId],
      queryFn: () => getProductById(productId),
      staleTime: 1000 * 60 * 15,
    });
  };
};
