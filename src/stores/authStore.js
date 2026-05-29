import { create } from "zustand";
import { persist } from "zustand/middleware";
import { user } from "../data/seed";

export const useAuthStore = create(
  persist(
    (set) => ({
      user,
      isAuthenticated: true,
      loginDemo: () => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: "ielts-vocab-auth",
      version: 4,
      migrate: () => ({ user, isAuthenticated: true })
    }
  )
);
