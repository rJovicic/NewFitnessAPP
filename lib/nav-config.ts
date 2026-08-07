import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Single source of truth for bottom-nav items and route registration —
// adding a module later is one new entry here + one new folder, per
// CLAUDE.md §5/§7.
export const navConfig: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: UtensilsCrossed },
  { href: "/train", label: "Train", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings },
];
