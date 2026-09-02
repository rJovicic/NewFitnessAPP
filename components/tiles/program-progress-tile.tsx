import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/fitness/metric-card";
import { getProgramProgress } from "@/app/(dashboard)/program-progress/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern.
export async function ProgramProgressTile() {
  const progress = await getProgramProgress();
  if (!progress) return null;

  return (
    <MetricCard
      tone="protein"
      icon={Target}
      label="Program progress"
      value={`Week ${progress.weekNumber}`}
      unit={`/ ~${progress.totalWeeks}`}
      footer={
        <div className="flex flex-col gap-1.5">
          <Progress value={progress.percentToGoal / 100} tone="protein" />
          <p className="text-xs text-muted-foreground">
            {progress.weightLostKg > 0 ? `${progress.weightLostKg}kg lost` : "Just started"}
            {" · "}
            {progress.weightRemainingKg > 0
              ? `${progress.weightRemainingKg}kg to goal`
              : "At goal weight"}
          </p>
        </div>
      }
    />
  );
}
