"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const SIZE = 220;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function beep() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — vibration is the fallback alert.
  }
}

export function RestTimer({
  seconds,
  nextExerciseName,
  nextSetLabel,
  onComplete,
}: {
  seconds: number;
  nextExerciseName?: string;
  nextSetLabel?: string;
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => Math.max(r - 1, 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      beep();
      onComplete();
    }
  }, [remaining, onComplete]);

  function adjust(delta: number) {
    setRemaining((r) => Math.max(r + delta, 0));
  }

  function skip() {
    if (!firedRef.current) {
      firedRef.current = true;
      onComplete();
    }
  }

  const fraction = seconds > 0 ? Math.min(remaining / seconds, 1) : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-label">Rest</p>
      <div className="relative size-[220px]">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="stroke-water transition-[stroke-dashoffset] duration-500 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
          <p className="tabular-data text-5xl font-semibold tracking-tight">
            {m}:{s.toString().padStart(2, "0")}
          </p>
          {nextExerciseName && (
            <div className="flex flex-col gap-0.5">
              <p className="text-label">
                Next
              </p>
              <p className="text-sm font-medium">{nextExerciseName}</p>
              {nextSetLabel && <p className="text-xs text-muted-foreground">{nextSetLabel}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Subtract 15 seconds from rest"
            onClick={() => adjust(-15)}
          >
            -15s
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Add 15 seconds to rest"
            onClick={() => adjust(15)}
          >
            +15s
          </Button>
        </div>
        <Button size="lg" className="w-full" onClick={skip}>
          Skip rest
        </Button>
      </div>
    </div>
  );
}
