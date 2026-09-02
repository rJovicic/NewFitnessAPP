import { cn } from "@/lib/utils";

const FILL_CLASS = {
  calories: "bg-calories",
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
  water: "bg-water",
  steps: "bg-steps",
  primary: "bg-primary",
} as const;

export type ProgressTone = keyof typeof FILL_CLASS;

// A plain linear meter — the shared primitive behind MacroBar and any
// other "current vs. target" readout. Deliberately un-animated width
// changes beyond the CSS transition below (prefers-reduced-motion turns
// that off globally, see app/globals.css).
export function Progress({
  value,
  tone = "primary",
  className,
  trackClassName,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
  trackClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(value, 1));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", trackClassName)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          FILL_CLASS[tone],
          className
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
