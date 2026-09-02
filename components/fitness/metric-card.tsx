import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTone = "calories" | "protein" | "carbs" | "fat" | "water" | "steps";

const TONE_CLASSES: Record<MetricTone, { bg: string; fg: string }> = {
  calories: { bg: "bg-calories-soft", fg: "text-calories" },
  protein: { bg: "bg-protein-soft", fg: "text-protein" },
  carbs: { bg: "bg-carbs-soft", fg: "text-carbs" },
  fat: { bg: "bg-fat-soft", fg: "text-fat" },
  water: { bg: "bg-water-soft", fg: "text-water" },
  steps: { bg: "bg-steps-soft", fg: "text-steps" },
};

// The semantic hue lives on the card's background, not just its icon —
// per CLAUDE.md §4/§6, this is the concrete difference between "neutral
// card + colored accent" and the intended calm-but-saturated per-metric
// surface.
export function MetricCard({
  tone,
  icon: Icon,
  label,
  value,
  unit,
  footer,
  className,
}: {
  tone: MetricTone;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  unit?: string;
  footer?: ReactNode;
  className?: string;
}) {
  const { bg, fg } = TONE_CLASSES[tone];
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl p-4", bg, className)}>
      <div className={cn("flex items-center gap-1.5", fg)}>
        <Icon className="size-4" strokeWidth={2} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <p className="tabular-data text-2xl font-semibold text-foreground">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground"> {unit}</span>}
      </p>
      {footer}
    </div>
  );
}
