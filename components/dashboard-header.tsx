import { APP_TIMEZONE, currentHourInAppTimezone } from "@/lib/timezone";

function greetingFor(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({ firstName }: { firstName: string }) {
  const now = new Date();
  const greeting = greetingFor(currentHourInAppTimezone(now));
  const dateLabel = now.toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="px-4 pt-6 pb-2">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {greeting}, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground">{dateLabel}</p>
    </header>
  );
}
