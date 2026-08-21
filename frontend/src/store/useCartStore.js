import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,
      appliedPromo: null,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),

      addToCart: (product, size = null, autoOpen = true) => {
        const itemKey = size ? `${product.id}-${size}` : product.id;
        const existing = get().items.find((i) => (i.cartKey || i.id) === itemKey);
        
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              (i.cartKey || i.id) === itemKey ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }));
        } else {
          set((state) => ({
            items: [...state.items, { ...product, cartKey: itemKey, selectedSize: size, quantity: 1 }],
          }));
        }

        if (autoOpen) {
          set({ isDrawerOpen: true });
        }
      },

      removeFromCart: (keyOrId) =>
        set((state) => ({
          items: state.items.filter((i) => (i.cartKey || i.id) !== keyOrId && i.id !== keyOrId),
        })),

      updateQuantity: (keyOrId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(keyOrId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            (i.cartKey || i.id) === keyOrId || i.id === keyOrId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedPromo: null }),

      setPromo: (promo) => set({ appliedPromo: promo }),
      removePromo: () => set({ appliedPromo: null }),

      get total() {
        return get().items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
      },

      get count() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: "vrital-cart" }
  )
);

