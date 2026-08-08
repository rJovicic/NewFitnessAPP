"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  addWater,
  logSleepHours,
  toggleSupplement,
  type DailyChecklistData,
} from "@/app/(dashboard)/checklist-actions";

function ChecklistRow({
  done,
  label,
  detail,
  children,
}: {
  done: boolean;
  label: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-2.5">
        {done ? (
          <Check className="size-4 shrink-0 text-fat" strokeWidth={2.5} />
        ) : (
          <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        )}
        <div className="flex flex-1 items-baseline justify-between">
          <span className={cn("text-sm font-medium", done && "text-fat")}>{label}</span>
          <span className="tabular-data text-xs text-muted-foreground">{detail}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export function DailyChecklist({ data }: { data: DailyChecklistData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sleepInput, setSleepInput] = useState(data.sleepHours?.toString() ?? "");

  function handleAddWater(ml: number) {
    startTransition(async () => {
      await addWater(ml);
      router.refresh();
    });
  }

  function handleLogSleep() {
    const hours = Number(sleepInput);
    if (!hours || hours <= 0) return;
    startTransition(async () => {
      await logSleepHours(hours);
      router.refresh();
    });
  }

  function handleToggleSupplement(id: string, currentlyTaken: boolean) {
    startTransition(async () => {
      await toggleSupplement(id, !currentlyTaken);
      router.refresh();
    });
  }

  const mealsDone = data.mealsLoggedCount >= 3;
  const waterDone = data.waterMl >= data.waterTargetMl;
  const stepsDone = data.steps !== null && data.steps >= data.stepsTarget;
  const sleepDone = data.sleepHours !== null && data.sleepHours >= data.sleepTargetHours;

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent>
          <ChecklistRow
            done={data.workoutCompleted}
            label="Workout"
            detail={data.workoutCompleted ? "Done" : "Not yet"}
          />
          <ChecklistRow
            done={mealsDone}
            label="Meals logged"
            detail={`${data.mealsLoggedCount}/3`}
          />
          <ChecklistRow
            done={waterDone}
            label="Water"
            detail={`${(data.waterMl / 1000).toFixed(1)}L / ${(data.waterTargetMl / 1000).toFixed(1)}L`}
          >
            <div className="ml-6.5 flex gap-2">
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleAddWater(250)}>
                +250ml
              </Button>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleAddWater(500)}>
                +500ml
              </Button>
            </div>
          </ChecklistRow>
          <ChecklistRow
            done={stepsDone}
            label="Steps"
            detail={
              data.steps !== null
                ? `${data.steps.toLocaleString()} / ${data.stepsTarget.toLocaleString()}`
                : "Not synced yet"
            }
          />
          <ChecklistRow
            done={sleepDone}
            label="Sleep"
            detail={
              data.sleepHours !== null
                ? `${data.sleepHours}h / ${data.sleepTargetHours}h`
                : `Target ${data.sleepTargetHours}h`
            }
          >
            <div className="ml-6.5 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                inputMode="decimal"
                placeholder="Hours"
                aria-label="Sleep hours"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
              />
              <Button size="sm" variant="outline" disabled={isPending || !sleepInput} onClick={handleLogSleep}>
                Log
              </Button>
            </div>
          </ChecklistRow>
        </CardContent>
      </Card>

      {data.supplements.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-medium">Supplements</p>
            {data.supplements.map((s) => (
              <button
                key={s.id}
                onClick={() => handleToggleSupplement(s.id, s.taken)}
                disabled={isPending}
                className="flex items-center gap-2.5 text-left"
              >
                {s.taken ? (
                  <Check className="size-4 shrink-0 text-fat" strokeWidth={2.5} />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                )}
                <span className={cn("text-sm", s.taken ? "text-fat" : "text-foreground")}>
                  {s.name}
                  {s.dose && <span className="text-muted-foreground"> · {s.dose}</span>}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
