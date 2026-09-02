import { Dumbbell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { TrainScreen } from "@/components/train-screen";
import { PageHeader } from "@/components/fitness/page-header";
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

  const subtitle =
    workout.exercises.length === 0
      ? "Rest day"
      : `${workout.workoutDay.durationMin} min · Block ${workout.block} of 4`;

  return (
    <div className="flex flex-col">
      <PageHeader eyebrow="Today's workout" title={workout.workoutDay.focusName} subtitle={subtitle} />
      <TrainScreen workout={workout} recentLogs={recentLogs} />
    </div>
  );
}
