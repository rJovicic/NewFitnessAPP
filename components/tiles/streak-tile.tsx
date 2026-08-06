import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StreakTile({ streak }: { streak: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className={cn("flex items-center gap-1.5", streak > 0 ? "text-calories" : "text-muted-foreground")}>
          <Flame className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">Streak</span>
        </div>
        <p className="tabular-data text-2xl font-semibold">
          {streak}
          <span className="text-sm font-normal text-muted-foreground"> days</span>
        </p>
      </CardContent>
    </Card>
  );
}
