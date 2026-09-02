import Link from "next/link";
import { cn } from "@/lib/utils";
import { getWeekDates } from "@/lib/timezone";

export function DayStrip({
  selectedDate,
  todayDate,
}: {
  selectedDate: string;
  todayDate: string;
}) {
  const week = getWeekDates(todayDate);

  return (
    <div className="flex justify-between gap-1.5 px-4 py-3">
      {week.map((dateStr) => {
        const d = new Date(`${dateStr}T00:00:00Z`);
        const label = d.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "narrow",
        });
        const dayNumber = d.getUTCDate();
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === todayDate;

        return (
          <Link
            key={dateStr}
            href={dateStr === todayDate ? "/" : `/?date=${dateStr}`}
            aria-current={isSelected ? "date" : undefined}
            className={cn(
              "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full py-2 text-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isSelected
                ? "bg-primary text-primary-foreground"
                : isToday
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span>{label}</span>
            <span className="tabular-data font-medium">{dayNumber}</span>
          </Link>
        );
      })}
    </div>
  );
}
