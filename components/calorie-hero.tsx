"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { MacroBar } from "@/components/macro-bar";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard-data";

// Open composition, no Card — the art-direction reset retired the last
// remaining hero card in the app. "Eaten" stays the headline DISPLAY
// figure (a deliberate content call, not just style: it's the number
// that actually moves through the day, unlike the static target) + a
// thin progress rule + target/remaining pair + macro rows, all sitting
// directly on the page like everything below it.
export function CalorieHero({ data }: { data: DashboardData }) {
  // Animate the thin progress rule in on mount rather than snapping to
  // it — prefers-reduced-motion zeroes the transition duration globally.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { kcal: loggedKcal } = data.logged;
  const { targetKcal } = data.targets;
  const isOver = targetKcal > 0 && loggedKcal > targetKcal;
  const fraction = targetKcal > 0 ? Math.min(loggedKcal / targetKcal, 1) : 0;
  const remaining = Math.abs(targetKcal - loggedKcal);

  return (
    <section className="flex flex-col gap-5 px-4 pb-6">
      <p className="text-label">{data.isToday ? "Today" : "That day"}</p>

      <div className="flex flex-col gap-1">
        <span className="font-display text-6xl font-semibold leading-none tracking-tight">
          {loggedKcal.toLocaleString()}
        </span>
        <span className="text-label">Eaten</span>
      </div>

      <Progress
        value={mounted ? fraction : 0}
        tone="calories"
        className={cn(isOver && "bg-destructive")}
        trackClassName="h-1"
      />

      <div className="flex items-baseline justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="tabular-data text-lg font-semibold">
            {targetKcal.toLocaleString()}
          </span>
          <span className="text-label">Target</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              "tabular-data text-lg font-semibold",
              isOver && "text-destructive"
            )}
          >
            {isOver ? "+" : ""}
            {remaining.toLocaleString()}
          </span>
          <span className="text-label">{isOver ? "Over" : "Remaining"}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <MacroBar
          label="Protein"
          color="protein"
          current={data.logged.proteinG}
          target={data.targets.proteinG}
          unit="g"
        />
        <MacroBar
          label="Carbs"
          color="carbs"
          current={data.logged.carbsG}
          target={data.targets.carbsG}
          unit="g"
        />
        <MacroBar
          label="Fat"
          color="fat"
          current={data.logged.fatG}
          target={data.targets.fatG}
          unit="g"
        />
      </div>
    </section>
  );
}
