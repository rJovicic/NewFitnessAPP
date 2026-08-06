"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export function FastingTile({
  windowStart,
  windowEnd,
}: {
  windowStart: string;
  windowEnd: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <Card>
        <CardContent className="flex items-center gap-1.5 text-muted-foreground">
          <Timer className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">
            Fasting window
          </span>
        </CardContent>
      </Card>
    );
  }

  const { start, end } = boundariesForToday(windowStart, windowEnd, now);
  const isEating = now >= start && now < end;

  let statusLabel: string;
  let remainingLabel: string;

  if (isEating) {
    statusLabel = "Eating window open";
    remainingLabel = `${formatDuration(end.getTime() - now.getTime())} left`;
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
    <Card>
      <CardContent className="flex items-center gap-2.5">
        <Timer
          className={cn("size-4 shrink-0", isEating ? "text-foreground" : "text-muted-foreground")}
          strokeWidth={2}
        />
        <div>
          <p className="text-sm font-medium">{statusLabel}</p>
          <p className="text-xs text-muted-foreground">{remainingLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
