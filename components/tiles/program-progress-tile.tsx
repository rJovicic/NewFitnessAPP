import { getProgramProgress } from "@/app/(dashboard)/program-progress/actions";

// Self-contained: fetches its own data, so wiring this in touched only
// lib/tile-registry.tsx, per the CLAUDE.md §7 extension pattern. Reads
// as the header of Home's "This week" section: WEEK N -> big kg-to-go
// figure -> TO GOAL — no card, no ring.
export async function ProgramProgressTile() {
  const progress = await getProgramProgress();
  if (!progress) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-label">
        Week {progress.weekNumber}
      </p>
      <p className="font-display text-3xl font-semibold tracking-tight">
        {progress.weightRemainingKg > 0 ? `${progress.weightRemainingKg} kg` : "Goal reached"}
      </p>
      {progress.weightRemainingKg > 0 && (
        <p className="text-label">
          To goal
        </p>
      )}
    </div>
  );
}
