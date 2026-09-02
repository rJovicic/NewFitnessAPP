"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { logMood } from "@/app/(dashboard)/mood/actions";

const MOODS = [
  { value: 1, emoji: "😞" },
  { value: 2, emoji: "😕" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😄" },
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

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={isPending}
            aria-label={`Mood ${m.value} out of 5`}
            aria-pressed={saved === m.value}
            onClick={() => handleLog(m.value)}
            className={cn(
              "flex size-14 items-center justify-center rounded-full border text-2xl transition-all active:scale-95",
              saved === m.value
                ? "border-primary bg-primary/5 scale-105"
                : "border-border hover:bg-muted"
            )}
          >
            <span aria-hidden="true">{m.emoji}</span>
          </button>
        ))}
      </div>
      {saved !== null && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-fat">
          <Check className="size-4" strokeWidth={2.5} /> Logged today: {saved}/5
        </p>
      )}
    </div>
  );
}
