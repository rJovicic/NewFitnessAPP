"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logMood } from "@/app/(dashboard)/mood/actions";

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
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant={saved === n ? "default" : "outline"}
            size="lg"
            disabled={isPending}
            aria-label={`Mood ${n} out of 5`}
            aria-pressed={saved === n}
            onClick={() => handleLog(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      {saved !== null && <p className="text-sm text-muted-foreground">Logged today: {saved}/5</p>}
    </div>
  );
}
