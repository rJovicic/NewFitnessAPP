import Link from "next/link";
import { Smile } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTodaysMood } from "@/app/(dashboard)/mood/actions";

// Self-contained: fetches its own data via the add-on's own action, so
// wiring this tile in required zero changes to lib/dashboard-data.ts.
export async function MoodTile() {
  const mood = await getTodaysMood();

  return (
    <Link href="/mood">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-steps">
            <Smile className="size-4" strokeWidth={2} />
            <span className="text-sm font-medium text-foreground">Mood</span>
          </div>
          <p className="tabular-data text-2xl font-semibold">{mood !== null ? `${mood}/5` : "—"}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
