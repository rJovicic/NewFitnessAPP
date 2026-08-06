import { ProgressScreen } from "@/components/progress-screen";
import { todayInAppTimezone } from "@/lib/timezone";
import {
  getWeightHistory,
  getAdjustmentSuggestions,
  getRecentProgressPhotos,
} from "./actions";

export default async function ProgressPage() {
  const [weightHistory, suggestions, photos] = await Promise.all([
    getWeightHistory(),
    getAdjustmentSuggestions(),
    getRecentProgressPhotos(),
  ]);

  return (
    <ProgressScreen
      weightHistory={weightHistory}
      suggestions={suggestions}
      photos={photos}
      todayDate={todayInAppTimezone()}
    />
  );
}
