import {
  BarChart3,
  ClipboardCheck,
  HandHeart,
  History,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface AppNavItem {
  /** `nav.*` message key. */
  key: string;
  path: string;
  icon: LucideIcon;
  /** Hidden from admins (admins can't donate). */
  userOnly?: boolean;
}

export interface AppNavGroup {
  /** `nav.sections.*` message key. */
  section: 'main' | 'admin';
  adminOnly?: boolean;
  items: AppNavItem[];
}

export const APP_NAV: AppNavGroup[] = [
  {
    section: 'main',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
      { key: 'donate', path: '/donate', icon: HandHeart, userOnly: true },
      { key: 'history', path: '/history', icon: History },
      { key: 'settings', path: '/settings', icon: Settings },
    ],
  },
  {
    section: 'admin',
    adminOnly: true,
    items: [
      { key: 'overview', path: '/admin/dashboard', icon: LayoutGrid },
      { key: 'donations', path: '/admin/donations', icon: ClipboardCheck },
      { key: 'users', path: '/admin/users', icon: Users },
      { key: 'reports', path: '/admin/reports', icon: BarChart3 },
    ],
  },
];
