import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard-data";

export function WaterTile({ data }: { data: DashboardData }) {
  const liters = (data.water.ml / 1000).toFixed(1);
  const targetLiters = (data.water.targetMl / 1000).toFixed(1);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-water">
          <Droplet className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">Water</span>
        </div>
        <p className="tabular-data text-2xl font-semibold">
          {liters}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {targetLiters}L
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
