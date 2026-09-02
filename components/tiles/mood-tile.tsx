import Link from "next/link";
import { getTodaysMood } from "@/app/(dashboard)/mood/actions";

// Self-contained: fetches its own data via the add-on's own action, so
// wiring this tile in required zero changes to lib/dashboard-data.ts.
// Bare stat block, no card — composed into Home's "This week" section.
export async function MoodTile() {
  const mood = await getTodaysMood();

  return (
    <Link
      href="/mood"
      className="-my-2 -mr-2 flex flex-col gap-0.5 rounded-sm border-l-2 py-2 pr-2 pl-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      style={{ borderColor: "var(--water)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mood</p>
      <p className="tabular-data text-lg font-semibold">{mood !== null ? `${mood}/5` : "—"}</p>
    </Link>
  );
}
