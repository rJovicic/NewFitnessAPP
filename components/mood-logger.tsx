"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { logMood } from "@/app/(dashboard)/mood/actions";

const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

export function MoodLogger({ initialMood }: { initialMood: number | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(initialMood);

  function handleLog(value: number) {
    startTransition(async () => {
      const result = await logMood(value);
      if (result.ok) {
        setSaved(value);
        router.refresh();
      }
    });
  }

  const savedMood = MOODS.find((m) => m.value === saved);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={isPending}
            aria-label={`Mood ${m.value} out of 5 — ${m.label}`}
            aria-pressed={saved === m.value}
            onClick={() => handleLog(m.value)}
            className={cn(
              "flex size-14 items-center justify-center rounded-full border text-2xl outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95",
              saved === m.value
                ? "border-primary bg-primary/5 scale-105"
                : "border-border hover:bg-muted"
            )}
          >
            <span aria-hidden="true">{m.emoji}</span>
          </button>
        ))}
      </div>
      {savedMood && (
        <p className="flex items-center gap-2 text-base font-medium">
          <span aria-hidden="true">{savedMood.emoji}</span>
          {savedMood.label}
        </p>
      )}
    </div>
  );
}
