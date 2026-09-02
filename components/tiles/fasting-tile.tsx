"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parseHms(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map(Number);
  return { h, m };
}

function boundariesForToday(startStr: string, endStr: string, now: Date) {
  const { h: sh, m: sm } = parseHms(startStr);
  const { h: eh, m: em } = parseHms(endStr);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(now);
  end.setHours(eh, em, 0, 0);
  return { start, end };
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(Math.round(ms / 60_000), 0);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// Plain status row, no card — composed as the last row of Home's "This
// week" section.
export function FastingTile({
  windowStart,
  windowEnd,
}: {
  windowStart: string;
  windowEnd: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Client-only mount: setting state directly in the effect body (rather
    // than in a callback) trips react-hooks/set-state-in-effect, so the
    // first tick goes through rAF, same pattern used for the calorie
    // hero's progress-rule mount animation.
    const frame = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, []);

  if (!now) {
    return (
      <div className="flex items-baseline justify-between py-3.5">
        <span className="text-sm font-medium">Fasting window</span>
      </div>
    );
  }

  const { start, end } = boundariesForToday(windowStart, windowEnd, now);
  const isEating = now >= start && now < end;
  const msUntilClose = end.getTime() - now.getTime();
  const isClosingSoon = isEating && msUntilClose <= 30 * 60_000;

  let statusLabel: string;
  let remainingLabel: string;

  if (isEating) {
    statusLabel = isClosingSoon ? "Window closing soon" : "Eating window open";
    remainingLabel = `${formatDuration(msUntilClose)} left`;
  } else if (now < start) {
    statusLabel = "Fasting";
    remainingLabel = `${formatDuration(start.getTime() - now.getTime())} until window opens`;
  } else {
    const nextStart = new Date(start);
    nextStart.setDate(nextStart.getDate() + 1);
    statusLabel = "Fasting";
    remainingLabel = `${formatDuration(nextStart.getTime() - now.getTime())} until window opens`;
  }

  return (
    <div className="flex items-baseline justify-between py-3.5">
      <span className={cn("text-sm font-medium", isClosingSoon && "text-carbs")}>
        {statusLabel}
      </span>
      <span className={cn("tabular-data text-sm text-muted-foreground", isClosingSoon && "text-carbs")}>
        {remainingLabel}
      </span>
    </div>
  );
}
