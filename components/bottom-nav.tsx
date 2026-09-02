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
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="flex items-stretch gap-0.5 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-nav backdrop-blur supports-backdrop-blur:bg-card/80">
          {primaryItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {moreItems.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                className={cn(
                  "flex min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  isMoreActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
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
