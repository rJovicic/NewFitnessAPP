"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { navConfig } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Presentation-only copy for the More sheet — kept out of nav-config.ts so
// the registry itself stays the minimal href/label/icon/primary shape.
const MORE_DESCRIPTIONS: Record<string, string> = {
  "/mood": "Daily check-in",
  "/settings": "App & preferences",
};

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = navConfig.filter((item) => item.primary);
  const moreItems = navConfig.filter((item) => !item.primary);
  const isMoreActive = moreItems.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {/* Edge-to-edge tab bar, not a floating inset pill — a hairline top
          border and page-matched background read as part of the app shell
          (per the Apple Fitness/Hevy/MacroFactor reference set) rather than
          a control placed on top of the content. Active state is carried by
          a top accent bar + icon/label color, never a filled pill. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch">
          {primaryItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {active && (
                    <span
                      className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {moreItems.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                className={cn(
                  "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                  isMoreActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isMoreActive && (
                  <span
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <MoreHorizontal className="size-5" strokeWidth={isMoreActive ? 2.25 : 1.75} />
                More
              </button>
            </li>
          )}
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1 pb-4">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active ? "bg-muted" : "hover:bg-muted"
                  )}
                >
                  <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    {MORE_DESCRIPTIONS[item.href] && (
                      <span className="text-xs text-muted-foreground">
                        {MORE_DESCRIPTIONS[item.href]}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
