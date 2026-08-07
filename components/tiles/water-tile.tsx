"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/dashboard-data";
import { addWater } from "@/app/(dashboard)/checklist-actions";

export function WaterTile({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const liters = (data.water.ml / 1000).toFixed(1);
  const targetLiters = (data.water.targetMl / 1000).toFixed(1);

  function handleAddWater(ml: number) {
    startTransition(async () => {
      await addWater(ml);
      router.refresh();
    });
  }

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
        {data.isToday && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 px-1 text-xs"
              disabled={isPending}
              onClick={() => handleAddWater(250)}
            >
              +250ml
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 flex-1 px-1 text-xs"
              disabled={isPending}
              onClick={() => handleAddWater(500)}
            >
              +500ml
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
