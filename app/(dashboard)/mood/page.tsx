import { MoodLogger } from "@/components/mood-logger";
import { PageHeader } from "@/components/fitness/page-header";
import { getTodaysMood } from "./actions";

export default async function MoodPage() {
  const mood = await getTodaysMood();

  return (
    <div className="flex flex-col">
      <PageHeader title="How are you feeling?" subtitle="A quick check-in — no right or wrong answer." />
      <div className="flex flex-col items-center gap-6 px-4 py-10">
        <MoodLogger initialMood={mood} />
      </div>
    </div>
  );
}
