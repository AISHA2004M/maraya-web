import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      brandSlug: null,

      setAuth: (user, token, role, brandSlug) => set({ user, token, role, brandSlug }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null, role: null, brandSlug: null }),

      get isLoggedIn() {
        return !!this.token;
      },
    }),
    { name: "vrital-user" }
  )
);

