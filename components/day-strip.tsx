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

        return (
          <Link
            key={dateStr}
            href={dateStr === todayDate ? "/" : `/?date=${dateStr}`}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
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
