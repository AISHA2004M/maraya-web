/**
 * Wishlist Store — Zustand
 * =========================
 * Client-side wishlist state that syncs with the backend.
 * 
 * For authenticated users: syncs to /api/v1/wishlist
 * For guests: stores in localStorage (migrated on login)
 *
 * Pattern matches ASOS/Zara: instant optimistic UI update,
 * background sync to server.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/client";

const useWishlistStore = create(
  persist(
    (set, get) => ({
      // product_id → true (saved items set)
      items: new Set(),
      count: 0,
      isLoading: false,

      // Hydrate from server (call on app load when user is authenticated)
      hydrateFromServer: async () => {
        try {
          const res = await api.get("/wishlist");
          const ids = new Set(res.data.map((item) => item.product_id));
          set({ items: ids, count: ids.size });
        } catch {
          // Not authenticated or server error — keep local state
        }
      },

      // Toggle wishlist item with optimistic update
      toggle: async (productId) => {
        const { items } = get();
        const wasSaved = items.has(productId);
        
        // Optimistic update — instant UI response
        const newItems = new Set(items);
        if (wasSaved) {
          newItems.delete(productId);
        } else {
          newItems.add(productId);
        }
        set({ items: newItems, count: newItems.size });

        try {
          const res = await api.post(`/wishlist/toggle?product_id=${productId}`);
          // Sync with server count
          set((state) => ({ count: res.data.wishlist_count }));
        } catch (err) {
          // Rollback on error
          set({ items, count: items.size });
          console.warn("Wishlist sync failed:", err.message);
        }
      },

      // Backward-compatible aliases for existing components
      isSaved: (productId) => get().items.has(productId),
      clearAll: () => set({ items: new Set(), count: 0 }),
      toggleWishlist: async (productId) => get().toggle(productId),
      isInWishlist: (productId) => get().items.has(productId),

    }),
    {
      name: "vrital-wishlist",
      // Serialize Set to array for localStorage
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              items: new Set(parsed.state.items || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              items: [...value.state.items],
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export default useWishlistStore;
// Named export for compatibility with existing imports
export { useWishlistStore };
