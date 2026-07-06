/**
 * useProducts Hooks — Optimized Cache Settings
 * =============================================
 * Each hook has tailored staleTime based on how often that data changes:
 *
 * Products:   10 min stale (updated by admin occasionally)
 * Brands:     1 hour stale (change very rarely)
 * Categories: 2 hours stale (almost never change)
 * Single product: 15 min stale (price/stock can change)
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
    queryFn: () => getProducts(params),
    staleTime: 1000 * 5,         // 5 seconds stale check (updates show up quickly)
    gcTime: 1000 * 60 * 30,      // 30 minutes in memory
  });

// ─── Single Product ────────────────────────────────────────────────────────────
export const useProduct = (id) =>
  useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 5,         // 5 seconds stale check
    gcTime: 1000 * 60 * 30,
  });

// ─── Brands ───────────────────────────────────────────────────────────────────
export const useBrands = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 60,   // 1 hour — brands rarely change
    gcTime: 1000 * 60 * 120,     // 2 hours in memory
  });

// ─── Single Brand ──────────────────────────────────────────────────────────────
export const useBrand = (id) =>
  useQuery({
    queryKey: ["brand", id],
    queryFn: () => getBrandById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  });

// ─── Categories ────────────────────────────────────────────────────────────────
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 120,  // 2 hours — categories almost never change
    gcTime: 1000 * 60 * 240,     // 4 hours in memory
  });

// ─── Prefetch Utility ──────────────────────────────────────────────────────────
/**
 * useProductPrefetch — prefetch a product on card hover
 * Usage: const prefetch = useProductPrefetch();
 *        <div onMouseEnter={() => prefetch(product.id)}>
 *
 * This preloads the product detail data 300ms into the hover,
 * so by the time user clicks, the data is already cached.
 */
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
