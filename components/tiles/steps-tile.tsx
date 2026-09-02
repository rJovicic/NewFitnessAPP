import type { DashboardData } from "@/lib/dashboard-data";

// Bare content, no card — composed by the Home page into the "Today"
// data section alongside WaterTile.
export function StepsTile({ data }: { data: DashboardData }) {
  const hasSteps = data.steps.count > 0;

  return (
    <div className="flex items-baseline justify-between border-t border-border py-3.5">
      <span className="text-sm font-medium">Steps</span>
      <span className="tabular-data text-sm text-muted-foreground">
        {hasSteps ? data.steps.count.toLocaleString() : "Not synced yet"}
      </span>
    </div>
  );
}
