/**
 * Tiny auth/sidebar UI state store (Zustand).
 *
 * Currently only holds the sidebar open/closed toggle for future
 * mobile drawer support. Kept minimal — no persistence, no actions
 * other than toggling.
 */
import { create } from 'zustand';

interface AuthUiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
