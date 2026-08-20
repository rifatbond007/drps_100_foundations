/**
 * Zustand client-side auth store.
 * Stores non-sensitive UI state only. Real auth state comes from NextAuth.
 */
'use client';

import { create } from 'zustand';

interface AuthState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
