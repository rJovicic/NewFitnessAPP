"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "@/components/fitness/metric-card";
import type { DashboardData } from "@/lib/dashboard-data";
import { addWater } from "@/app/(dashboard)/checklist-actions";

export function WaterTile({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liters = (data.water.ml / 1000).toFixed(1);
  const targetLiters = (data.water.targetMl / 1000).toFixed(1);
  const fraction = data.water.targetMl > 0 ? data.water.ml / data.water.targetMl : 0;

  function handleAddWater(ml: number) {
    startTransition(async () => {
      await addWater(ml);
      router.refresh();
    });
  }

  return (
    <MetricCard
      tone="water"
      icon={Droplet}
      label="Water"
      value={liters}
      unit={`/ ${targetLiters}L`}
      footer={
        <div className="flex flex-col gap-2">
          <Progress value={fraction} tone="water" />
          {data.isToday && (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-9 flex-1 border-water/25 bg-card/70 px-1 text-xs hover:bg-card"
                disabled={isPending}
                onClick={() => handleAddWater(250)}
              >
                +250ml
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 flex-1 border-water/25 bg-card/70 px-1 text-xs hover:bg-card"
                disabled={isPending}
                onClick={() => handleAddWater(500)}
              >
                +500ml
              </Button>
            </div>
          )}
        </div>
      }
    />
  );
}
