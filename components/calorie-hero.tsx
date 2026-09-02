import { Card, CardContent } from "@/components/ui/card";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import type { DashboardData } from "@/lib/dashboard-data";

// The dashboard's signature surface: the calorie ring and the three macro
// bars read as one cohesive hero, not a ring plus a separate card — per
// CLAUDE.md §16.
export function CalorieHero({ data }: { data: DashboardData }) {
  return (
    <Card elevated className="mx-4">
      <CardContent className="flex flex-col gap-5 p-5">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Today&apos;s calories
        </p>
        <CalorieRing loggedKcal={data.logged.kcal} targetKcal={data.targets.targetKcal} />
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <MacroBar
            label="Protein"
            color="protein"
            current={data.logged.proteinG}
            target={data.targets.proteinG}
            unit="g"
          />
          <MacroBar
            label="Carbs"
            color="carbs"
            current={data.logged.carbsG}
            target={data.targets.carbsG}
            unit="g"
          />
          <MacroBar
            label="Fat"
            color="fat"
            current={data.logged.fatG}
            target={data.targets.fatG}
            unit="g"
          />
        </div>
      </CardContent>
    </Card>
  );
}
