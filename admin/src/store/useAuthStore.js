import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      brandSlug: null,

      setAuth: (user, token, role, brandSlug) => set({ user, token, role, brandSlug }),
      logout: () => set({ user: null, token: null, role: null, brandSlug: null }),
    }),
    { name: "vrital-admin-auth" }
  )
);
