import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StreakTile() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Flame className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">Streak</span>
        </div>
        <p className="tabular-data text-2xl font-semibold text-muted-foreground">
          —
          <span className="text-sm font-normal"> days</span>
        </p>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </CardContent>
    </Card>
  );
}
