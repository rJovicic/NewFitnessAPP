"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DayCell {
  label: string;
  dayNumber: number;
  isToday: boolean;
}

function currentWeek(): DayCell[] {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      dayNumber: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export function DayStrip() {
  const [days, setDays] = useState<DayCell[] | null>(null);

  useEffect(() => {
    setDays(currentWeek());
  }, []);

  return (
    <div className="flex justify-between gap-1.5 px-4 py-3">
      {(days ?? Array.from({ length: 7 })).map((day, i) => {
        const cell = day as DayCell | undefined;
        return (
          <div
            key={i}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs",
              cell?.isToday
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            <span>{cell?.label ?? ""}</span>
            <span className="tabular-data font-medium">
              {cell?.dayNumber ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
