import { Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FastingTile() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Timer className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium text-foreground">
            Fasting window
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </CardContent>
    </Card>
  );
}
