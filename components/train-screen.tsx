"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Dumbbell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RestTimer } from "@/components/rest-timer";
import { SectionHeader } from "@/components/fitness/section-header";
import { cn } from "@/lib/utils";
import {
  logWorkout,
  type TodaysWorkout,
  type WorkoutLogSummary,
} from "@/app/(dashboard)/train/actions";

interface Step {
  exerciseIndex: number;
  setNumber: number;
}

// Deterministic per-exercise accent — no muscle-group -> color mapping is
// stored, so this cycles the existing semantic palette by list position
// rather than fabricating new per-exercise metadata. Gives each exercise
// module in the overview a distinct identity, Hevy-style, instead of a
// uniform muted row.
const EXERCISE_TONES = ["calories", "protein", "carbs", "fat", "water", "steps"] as const;

function buildSteps(exercises: TodaysWorkout["exercises"]): Step[] {
  const steps: Step[] = [];
  exercises.forEach((ex, exerciseIndex) => {
    for (let setNumber = 1; setNumber <= ex.rounds; setNumber++) {
      steps.push({ exerciseIndex, setNumber });
    }
  });
  return steps;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [finishedDurationSeconds, setFinishedDurationSeconds] = useState(0);
  const [perceivedEffort, setPerceivedEffort] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function start() {
    setStepIndex(0);
    setStartedAt(Date.now());
    setPhase("active");
  }

  function markSetDone() {
    if (stepIndex >= steps.length - 1) {
      setFinishedDurationSeconds(
        startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0
      );
      setPhase("done");
    } else {
      setPhase("resting");
    }
  }

  function afterRest() {
    setStepIndex((i) => i + 1);
    setPhase("active");
  }

  async function finish() {
    if (perceivedEffort === null || !startedAt) return;
    setSaving(true);
    const result = await logWorkout({
      workoutDayId: workout.workoutDay.id,
      durationSeconds: finishedDurationSeconds,
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
    const isLastStep = stepIndex >= steps.length - 1;
    const nextStep = steps[stepIndex + 1];
    const nextExercise = nextStep ? workout.exercises[nextStep.exerciseIndex] : undefined;

    return (
      <div className="flex min-h-[calc(100svh-9rem)] flex-col justify-between gap-8 px-4 py-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex w-full flex-col gap-1.5">
            <p className="tabular-data text-xs font-medium text-muted-foreground">
              Exercise {step.exerciseIndex + 1} of {workout.exercises.length}
            </p>
            <Progress value={(stepIndex + 1) / steps.length} tone="calories" />
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Set {step.setNumber} of {exercise.rounds}
            </p>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: exercise.rounds }, (_, idx) => {
                const setNum = idx + 1;
                const isDone = setNum < step.setNumber;
                const isCurrent = setNum === step.setNumber;
                return (
                  <span
                    key={idx}
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      isDone ? "bg-fat" : isCurrent ? "bg-primary" : "bg-muted"
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="font-display text-3xl font-semibold text-balance">{exercise.name}</h2>
            <p className="text-base font-medium">{exercise.repsTarget}</p>
          </div>

          {exercise.instructions && (
            <details className="group w-full rounded-lg border border-border p-3.5 text-left">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                How to
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{exercise.instructions}</p>
            </details>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-2.5">
          <Button size="lg" className="w-full" onClick={markSetDone}>
            {isLastStep ? "Finish last set" : "Set complete"}
          </Button>
          {nextExercise && nextStep && (
            <p className="text-xs text-muted-foreground">
              Next · {nextExercise.name} · Set {nextStep.setNumber} of {nextExercise.rounds}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "resting") {
    const step = steps[stepIndex];
    const nextStep = steps[stepIndex + 1];
    const exercise = workout.exercises[step.exerciseIndex];
    const nextExercise = nextStep ? workout.exercises[nextStep.exerciseIndex] : exercise;
    const nextSetLabel = nextStep
      ? `Set ${nextStep.setNumber} of ${nextExercise.rounds}`
      : undefined;

    return (
      <div className="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center gap-6 px-4 py-8">
        <RestTimer
          seconds={exercise.restSeconds}
          nextExerciseName={nextExercise.name}
          nextSetLabel={nextSetLabel}
          onComplete={afterRest}
        />
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-fat-soft text-fat">
          <Check className="size-8" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold">Workout complete</h2>
          <p className="tabular-data text-sm text-muted-foreground">
            {formatDuration(finishedDurationSeconds)} · {workout.exercises.length} exercises ·{" "}
            {steps.length} sets
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <p className="text-sm font-medium">How did it feel?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                variant={perceivedEffort === n ? "default" : "outline"}
                size="icon"
                aria-label={`Perceived effort ${n} out of 5`}
                aria-pressed={perceivedEffort === n}
                onClick={() => setPerceivedEffort(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {saveMessage && <p className="text-sm text-destructive">{saveMessage}</p>}
        <Button className="w-full" onClick={finish} disabled={perceivedEffort === null || saving}>
          {saving ? "Saving..." : "Save workout"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {workout.alreadyLoggedToday && (
        <p className="flex items-center gap-1 text-xs font-medium text-fat">
          <Check className="size-4" /> Already logged today
        </p>
      )}

      {workout.exercises.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm font-medium">Rest day</p>
          <p className="text-sm text-muted-foreground">Recovery is part of the program.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col pb-2">
            {workout.exercises.map((ex, i) => {
              const tone = EXERCISE_TONES[i % EXERCISE_TONES.length];
              return (
                <div
                  key={ex.id}
                  className="flex items-start gap-3 border-t border-border py-4 first:border-t-0"
                >
                  <span
                    className="tabular-data mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `var(--${tone}-soft)`,
                      color: `var(--${tone})`,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular-data text-sm font-medium">{ex.repsTarget}</p>
                        <p className="tabular-data text-xs text-muted-foreground">{ex.rounds} sets</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex gap-1" aria-hidden="true">
                      {Array.from({ length: ex.rounds }, (_, s) => (
                        <span
                          key={s}
                          className="h-1 flex-1 rounded-full"
                          style={{ backgroundColor: `var(--${tone}-soft)` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-24 z-10 -mx-4 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-2">
            <Button size="lg" className="w-full" onClick={start}>
              <Play className="size-4" /> Start workout
            </Button>
          </div>
        </>
      )}

      {recentLogs.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader title="Recent" />
          <div className="flex flex-col">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 border-t border-border py-3 first:border-t-0"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Dumbbell className="size-3.5" strokeWidth={1.75} />
                </span>
                <div className="flex flex-1 items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{log.focusName}</span>
                  <span className="tabular-data text-xs text-muted-foreground">
                    {log.durationSeconds ? `${Math.round(log.durationSeconds / 60)} min` : "—"} ·
                    Effort {log.perceivedEffort ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
