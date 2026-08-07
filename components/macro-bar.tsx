import { cn } from "@/lib/utils";

type MacroColor = "protein" | "carbs" | "fat" | "water" | "steps";

const FILL_CLASS: Record<MacroColor, string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
  water: "bg-water",
  steps: "bg-steps",
};

export function MacroBar({
  label,
  color,
  current,
  target,
  unit,
}: {
  label: string;
  color: MacroColor;
  current: number;
  target: number;
  unit: string;
}) {
  const fraction = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="tabular-data text-xs text-muted-foreground">
          {Math.round(current)}
          <span className="text-muted-foreground">/{Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", FILL_CLASS[color])}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
