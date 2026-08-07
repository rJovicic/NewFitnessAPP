import { cn } from "@/lib/utils";

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({
  loggedKcal,
  targetKcal,
}: {
  loggedKcal: number;
  targetKcal: number;
}) {
  const isOver = targetKcal > 0 && loggedKcal > targetKcal;
  const fraction = targetKcal > 0 ? Math.min(loggedKcal / targetKcal, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const remaining = Math.abs(targetKcal - loggedKcal);

  return (
    <div className="relative mx-auto size-[200px]">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500 ease-out",
            isOver ? "stroke-destructive" : "stroke-calories"
          )}
        />
        {/* Dial zero-mark, at the 12 o'clock start of the arc */}
        <circle
          cx={SIZE / 2}
          cy={STROKE / 2}
          r={2.5}
          className="fill-background"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="tabular-data text-4xl font-semibold tracking-tight">
          {loggedKcal.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">
          of {targetKcal.toLocaleString()} kcal
        </span>
        {loggedKcal > 0 && (
          <span
            className={cn(
              "text-xs",
              isOver ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {isOver
              ? `+${remaining.toLocaleString()} over`
              : remaining > 0
                ? `${remaining.toLocaleString()} left`
                : "target reached"}
          </span>
        )}
      </div>
    </div>
  );
}
