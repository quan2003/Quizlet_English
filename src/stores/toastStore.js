import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],
  pushToast: ({ title, description = "", type = "success" }) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { id, title, description, type }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));
