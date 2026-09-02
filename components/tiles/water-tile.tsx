"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard-data";
import { addWater } from "@/app/(dashboard)/checklist-actions";

// Bare content, no card — composed by the Home page into the "Today"
// data section alongside StepsTile. See globals.css's art-direction note.
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
    <div className="flex flex-col gap-2 py-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Water</span>
        <span className="tabular-data text-sm text-muted-foreground">
          {liters} / {targetLiters} L
        </span>
      </div>
      <Progress value={fraction} tone="water" trackClassName="h-1" />
      {data.isToday && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => handleAddWater(250)}
          >
            +250 ml
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => handleAddWater(500)}
          >
            +500 ml
          </Button>
        </div>
      )}
    </div>
  );
}
