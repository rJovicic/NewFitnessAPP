"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RestTimer } from "@/components/rest-timer";
import {
  logWorkout,
  type TodaysWorkout,
  type WorkoutLogSummary,
} from "@/app/(dashboard)/train/actions";

interface Step {
  exerciseIndex: number;
  setNumber: number;
}

function buildSteps(exercises: TodaysWorkout["exercises"]): Step[] {
  const steps: Step[] = [];
  exercises.forEach((ex, exerciseIndex) => {
    for (let setNumber = 1; setNumber <= ex.rounds; setNumber++) {
      steps.push({ exerciseIndex, setNumber });
    }
  });
  return steps;
}

type Phase = "overview" | "active" | "resting" | "done";

export function TrainScreen({
  workout,
  recentLogs,
}: {
  workout: TodaysWorkout;
  recentLogs: WorkoutLogSummary[];
}) {
  const router = useRouter();
  const steps = useMemo(() => buildSteps(workout.exercises), [workout.exercises]);
  const [phase, setPhase] = useState<Phase>("overview");
  const [stepIndex, setStepIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [perceivedEffort, setPerceivedEffort] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function start() {
    setStepIndex(0);
    setStartedAt(Date.now());
    setPhase("active");
  }

  function markSetDone() {
    setPhase(stepIndex >= steps.length - 1 ? "done" : "resting");
  }

  function afterRest() {
    setStepIndex((i) => i + 1);
    setPhase("active");
  }

  async function finish() {
    if (perceivedEffort === null || !startedAt) return;
    setSaving(true);
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    const result = await logWorkout({
      workoutDayId: workout.workoutDay.id,
      durationSeconds,
      roundsCompleted: steps.length,
      perceivedEffort,
    });
    setSaving(false);
    if (result.ok) {
      setPhase("overview");
      setPerceivedEffort(null);
      router.refresh();
    } else {
      setSaveMessage(result.message ?? "Couldn't save. Try again.");
    }
  }

  if (phase === "active") {
    const step = steps[stepIndex];
    const exercise = workout.exercises[step.exerciseIndex];
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8">
        <p className="text-xs text-muted-foreground">
          Set {step.setNumber} of {exercise.rounds} · Exercise {step.exerciseIndex + 1} of{" "}
          {workout.exercises.length}
        </p>
        <h2 className="font-display text-2xl font-semibold text-center">{exercise.name}</h2>
        <p className="text-sm text-muted-foreground">{exercise.repsTarget}</p>
        <Button size="lg" onClick={markSetDone}>
          Set done
        </Button>
      </div>
    );
  }

  if (phase === "resting") {
    const step = steps[stepIndex];
    const exercise = workout.exercises[step.exerciseIndex];
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8">
        <RestTimer seconds={exercise.restSeconds} onComplete={afterRest} />
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-4 px-4 py-8">
        <h2 className="font-display text-lg font-semibold">Workout complete</h2>
        <p className="text-sm text-muted-foreground">How did it feel?</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              variant={perceivedEffort === n ? "default" : "outline"}
              size="sm"
              aria-label={`Perceived effort ${n} out of 5`}
              aria-pressed={perceivedEffort === n}
              onClick={() => setPerceivedEffort(n)}
            >
              {n}
            </Button>
          ))}
        </div>
        {saveMessage && <p className="text-sm text-destructive">{saveMessage}</p>}
        <Button onClick={finish} disabled={perceivedEffort === null || saving}>
          {saving ? "Saving..." : "Finish workout"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{workout.workoutDay.focusName}</h2>
        <p className="text-xs text-muted-foreground">
          {workout.workoutDay.durationMin} min · Block {workout.block} of 4
        </p>
      </div>

      {workout.alreadyLoggedToday && (
        <p className="flex items-center gap-1 text-xs font-medium text-fat">
          <Check className="size-4" /> Already logged today
        </p>
      )}

      {workout.exercises.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rest day — no exercises scheduled.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {workout.exercises.map((ex) => (
              <Card key={ex.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.muscleGroup} · {ex.repsTarget}
                    </p>
                  </div>
                  <span className="tabular-data text-xs text-muted-foreground">
                    {ex.rounds}× · {ex.restSeconds}s rest
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={start}>
            <Play className="size-4" /> Start workout
          </Button>
        </>
      )}

      {recentLogs.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Recent</h3>
          {recentLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{log.focusName}</span>
                <span className="tabular-data">
                  {log.durationSeconds ? `${Math.round(log.durationSeconds / 60)} min` : "—"} ·
                  Effort {log.perceivedEffort ?? "—"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
