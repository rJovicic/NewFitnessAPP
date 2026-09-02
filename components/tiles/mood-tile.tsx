import Link from "next/link";
import { Smile } from "lucide-react";
import { MetricCard } from "@/components/fitness/metric-card";
import { getTodaysMood } from "@/app/(dashboard)/mood/actions";

// Self-contained: fetches its own data via the add-on's own action, so
// wiring this tile in required zero changes to lib/dashboard-data.ts.
export async function MoodTile() {
  const mood = await getTodaysMood();

  return (
    <Link href="/mood" className="block rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <MetricCard tone="steps" icon={Smile} label="Mood" value={mood !== null ? mood : "—"} unit={mood !== null ? "/5" : undefined} />
    </Link>
  );
}
