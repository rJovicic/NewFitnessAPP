"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
  onComplete,
}: {
  seconds: number;
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

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <p className="text-xs text-muted-foreground">Rest</p>
      <p className="tabular-data text-6xl font-semibold tracking-tight">
        {m}:{s.toString().padStart(2, "0")}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => adjust(-15)}>
          -15s
        </Button>
        <Button variant="outline" size="sm" onClick={() => adjust(15)}>
          +15s
        </Button>
        <Button variant="ghost" size="sm" onClick={skip}>
          Skip
        </Button>
      </div>
    </div>
  );
}
