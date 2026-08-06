import { Card, CardContent } from "@/components/ui/card";
import { MacroBar } from "@/components/macro-bar";
import type { DashboardData } from "@/lib/dashboard-data";

export function MacrosTile({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
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
      </CardContent>
    </Card>
  );
}
