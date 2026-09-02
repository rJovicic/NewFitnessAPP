import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  LineChart,
  Smile,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown as one of the primary bottom-nav tabs; false surfaces the item
   *  in the "More" sheet instead. Keeps the tab bar to a scannable number
   *  of primary items without dropping the registry pattern. */
  primary: boolean;
}

// Single source of truth for bottom-nav items and route registration —
// adding a module later is one new entry here + one new folder, per
// CLAUDE.md §5/§7.
export const navConfig: NavItem[] = [
  { href: "/", label: "Home", icon: Home, primary: true },
  { href: "/log", label: "Log", icon: UtensilsCrossed, primary: true },
  { href: "/train", label: "Train", icon: Dumbbell, primary: true },
  { href: "/progress", label: "Progress", icon: LineChart, primary: true },
  { href: "/mood", label: "Mood", icon: Smile, primary: false },
  { href: "/settings", label: "Settings", icon: Settings, primary: false },
];
