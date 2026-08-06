import { Dumbbell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { TrainScreen } from "@/components/train-screen";
import { getTodaysWorkout, getRecentWorkoutLogs } from "./actions";

export default async function TrainPage() {
  const [workout, recentLogs] = await Promise.all([
    getTodaysWorkout(),
    getRecentWorkoutLogs(),
  ]);

  if (!workout) {
    return (
      <ComingSoon
        icon={Dumbbell}
        title="Today's workout"
        description="Couldn't load today's workout. Try refreshing."
      />
    );
  }

  return <TrainScreen workout={workout} recentLogs={recentLogs} />;
}
