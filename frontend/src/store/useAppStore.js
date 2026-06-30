import { create } from 'zustand'

export const useAppStore = create((set) => ({
  isNavigationOpen: false,
  setNavigationOpen: (isNavigationOpen) => set({ isNavigationOpen }),
}))
