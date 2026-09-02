"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/fitness/section-header";
import { cn } from "@/lib/utils";
import {
  logSleepHours,
  toggleSupplement,
  type DailyChecklistData,
} from "@/app/(dashboard)/checklist-actions";

interface ChecklistItem {
  label: string;
  done: boolean;
  detail: string;
  children?: ReactNode;
}

// A numbered ritual list, not a card full of checkbox widgets — the row
// itself (number, label, value, thin divider) carries the hierarchy, so
// no border/background/shadow wrapper is needed per item.
function ChecklistRow({ index, item }: { index: number; item: ChecklistItem }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border py-3.5 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="tabular-data w-5 shrink-0 text-xs font-medium text-muted-foreground">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex flex-1 items-baseline justify-between gap-3">
          <span className={cn("text-sm font-medium", item.done && "text-fat")}>{item.label}</span>
          <span className="tabular-data text-sm text-muted-foreground">{item.detail}</span>
        </div>
        {item.done ? (
          <Check className="size-4 shrink-0 text-fat" strokeWidth={2.5} />
        ) : (
          <span className="size-4 shrink-0" aria-hidden="true" />
        )}
      </div>
      {item.children && <div className="pl-8">{item.children}</div>}
    </div>
  );
}

export function DailyChecklist({ data }: { data: DailyChecklistData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sleepInput, setSleepInput] = useState(data.sleepHours?.toString() ?? "");

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

  const items: ChecklistItem[] = [
    {
      label: "Workout",
      done: data.workoutCompleted,
      detail: data.workoutCompleted ? "Done" : "—",
    },
    {
      label: "Meals",
      done: mealsDone,
      detail: `${data.mealsLoggedCount} / 3`,
    },
    {
      label: "Water",
      done: waterDone,
      detail: `${(data.waterMl / 1000).toFixed(1)} / ${(data.waterTargetMl / 1000).toFixed(1)} L`,
    },
    {
      label: "Steps",
      done: stepsDone,
      detail: data.steps !== null ? data.steps.toLocaleString() : "—",
    },
    {
      label: "Sleep",
      done: sleepDone,
      detail: data.sleepHours !== null ? `${data.sleepHours}h` : `${data.sleepTargetHours}h target`,
      children: (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.5"
            inputMode="decimal"
            placeholder="Hours"
            aria-label="Sleep hours"
            value={sleepInput}
            onChange={(e) => setSleepInput(e.target.value)}
            className="h-9 w-20 px-2 text-sm"
          />
          <Button size="sm" variant="outline" disabled={isPending || !sleepInput} onClick={handleLogSleep}>
            Log
          </Button>
        </div>
      ),
    },
  ];

  const completeCount = items.filter((item) => item.done).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <SectionHeader
          title="Today's checklist"
          action={
            <span className="tabular-data text-sm text-muted-foreground">
              {completeCount} / {items.length}
            </span>
          }
        />
        <div className="mt-2">
          {items.map((item, i) => (
            <ChecklistRow key={item.label} index={i + 1} item={item} />
          ))}
        </div>
      </div>

      {data.supplements.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionHeader title="Supplements" />
          <div className="flex flex-col">
            {data.supplements.map((s) => (
              <button
                key={s.id}
                onClick={() => handleToggleSupplement(s.id, s.taken)}
                disabled={isPending}
                className="flex min-h-11 items-center gap-2.5 border-t border-border py-2.5 text-left outline-none first:border-t-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {s.taken ? (
                  <Check className="size-4 shrink-0 text-fat" strokeWidth={2.5} />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border border-border" aria-hidden="true" />
                )}
                <span className={cn("text-sm", s.taken ? "text-fat" : "text-foreground")}>
                  {s.name}
                  {s.dose && <span className="text-muted-foreground"> · {s.dose}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
