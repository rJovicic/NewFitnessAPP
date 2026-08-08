import { Smile } from "lucide-react";
import { MoodLogger } from "@/components/mood-logger";
import { getTodaysMood } from "./actions";

export default async function MoodPage() {
  const mood = await getTodaysMood();

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-12 text-center">
      <Smile className="size-8 text-muted-foreground" strokeWidth={1.5} />
      <div>
        <h2 className="font-display text-lg font-semibold">Morning mood</h2>
        <p className="text-sm text-muted-foreground">
          A quick daily check-in — no plan tie-in, just a number to notice trends over time.
        </p>
      </div>
      <MoodLogger initialMood={mood} />
    </div>
  );
}
