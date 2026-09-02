import { Footprints } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/fitness/metric-card";
import type { DashboardData } from "@/lib/dashboard-data";

export function StepsTile({ data }: { data: DashboardData }) {
  const hasSteps = data.steps.count > 0;
  const fraction = data.steps.targetCount > 0 ? data.steps.count / data.steps.targetCount : 0;

  return (
    <MetricCard
      tone="steps"
      icon={Footprints}
      label="Steps"
      value={hasSteps ? data.steps.count.toLocaleString() : "—"}
      footer={
        hasSteps ? (
          <Progress value={fraction} tone="steps" />
        ) : (
          <p className="text-xs text-muted-foreground">Not synced yet</p>
        )
      }
    />
  );
}
