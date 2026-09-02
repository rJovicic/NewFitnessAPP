import { Progress, type ProgressTone } from "@/components/ui/progress";

export function MacroBar({
  label,
  color,
  current,
  target,
  unit,
}: {
  label: string;
  color: ProgressTone;
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
          <span className="text-muted-foreground">
            /{Math.round(target)}
            {unit}
          </span>
        </span>
      </div>
      <Progress value={fraction} tone={color} />
    </div>
  );
}
