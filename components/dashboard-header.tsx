"use client";

import { useEffect, useState } from "react";

function greetingFor(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ firstName }: { firstName: string }) {
  // Computed client-side so it reflects the user's actual local time
  // rather than the server's (Vercel region != Robert's timezone).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const greeting = now ? greetingFor(now.getHours()) : "Hello";
  const dateLabel = now
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <header className="px-4 pt-6 pb-2">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {greeting}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground">{dateLabel}</p>
    </header>
  );
}
