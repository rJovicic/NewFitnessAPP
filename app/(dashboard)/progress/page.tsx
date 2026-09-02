import { ProgressScreen } from "@/components/progress-screen";
import { PageHeader } from "@/components/fitness/page-header";
import { todayInAppTimezone } from "@/lib/timezone";
import {
  getWeightHistory,
  getWeightSummary,
  getMeasurementStats,
  getAdjustmentSuggestions,
  getRecentProgressPhotos,
} from "./actions";

export default async function ProgressPage() {
  const [weightSummary, weightHistory, measurements, suggestions, photos] = await Promise.all([
    getWeightSummary(),
    getWeightHistory(3650),
    getMeasurementStats(),
    getAdjustmentSuggestions(),
    getRecentProgressPhotos(),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Your progress" subtitle="Weight · Measurements · Photos" />
      <ProgressScreen
        weightSummary={weightSummary}
        weightHistory={weightHistory}
        measurements={measurements}
        suggestions={suggestions}
        photos={photos}
        todayDate={todayInAppTimezone()}
      />
    </div>
  );
}
