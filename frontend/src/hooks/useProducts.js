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
import {
  FALLBACK_PRODUCTS,
  FALLBACK_BRANDS,
  FALLBACK_CATEGORIES,
  findFallbackProduct
} from "../utils/fallbackData";

// ─── Products List ─────────────────────────────────────────────────────────────
export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
    placeholderData: FALLBACK_PRODUCTS,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

// ─── Single Product ────────────────────────────────────────────────────────────
export const useProduct = (id) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    placeholderData: () => findFallbackProduct(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

// ─── Brands ───────────────────────────────────────────────────────────────────
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
    placeholderData: FALLBACK_BRANDS,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  });

// ─── Single Brand ──────────────────────────────────────────────────────────────
export const useBrand = (id) =>
  useQuery({
    queryKey: ["brand", id],
    queryFn: () => getBrandById(id),
    placeholderData: () => FALLBACK_BRANDS.find(b => String(b.id) === String(id) || b.slug === id) || FALLBACK_BRANDS[0],
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  });

// ─── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    placeholderData: FALLBACK_CATEGORIES,
    staleTime: 1000 * 60 * 120,
    gcTime: 1000 * 60 * 240,
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
