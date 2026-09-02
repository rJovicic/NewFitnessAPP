"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/fitness/section-header";
import { StatRow } from "@/components/fitness/stat-row";
import { EmptyState } from "@/components/fitness/empty-state";
import { WeightChart } from "@/components/weight-chart";
import { cn } from "@/lib/utils";
import {
  logWeight,
  logBodyMeasurement,
  uploadProgressPhoto,
  applyAdjustment,
  type WeightPoint,
  type ProgressPhotoEntry,
  type WeightSummary,
  type MeasurementStat,
} from "@/app/(dashboard)/progress/actions";
import type { AdjustmentSuggestion } from "@/lib/adjustment";

const PHOTO_ANGLES = ["front", "side", "back"] as const;
type PhotoAngle = (typeof PHOTO_ANGLES)[number];

export function ProgressScreen({
  weightSummary,
  weightHistory,
  measurements,
  suggestions,
  photos,
  todayDate,
}: {
  weightSummary: WeightSummary | null;
  weightHistory: WeightPoint[];
  measurements: MeasurementStat[];
  suggestions: AdjustmentSuggestion[];
  photos: ProgressPhotoEntry[];
  todayDate: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weightInput, setWeightInput] = useState("");
  const [weightMessage, setWeightMessage] = useState<string | null>(null);

  const [measurementsOpen, setMeasurementsOpen] = useState(false);
  const [measurementInputs, setMeasurementInputs] = useState({
    waist: "",
    chest: "",
    hips: "",
    biceps: "",
    thigh: "",
  });
  const [measurementsMessage, setMeasurementsMessage] = useState<string | null>(null);

  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [dismissedTypes, setDismissedTypes] = useState<string[]>([]);
  const [adjustmentMessage, setAdjustmentMessage] = useState<string | null>(null);
  const fileInputs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  function handleLogWeight() {
    const weightKg = Number(weightInput);
    if (!weightKg || weightKg <= 0) return;
    startTransition(async () => {
      const result = await logWeight({ dateStr: todayDate, weightKg });
      if (result.ok) {
        setWeightInput("");
        setWeightMessage(null);
        router.refresh();
      } else {
        setWeightMessage(result.message ?? "Couldn't save. Try again.");
      }
    });
  }

  function handleLogMeasurements() {
    startTransition(async () => {
      const result = await logBodyMeasurement({
        dateStr: todayDate,
        waistCm: measurementInputs.waist ? Number(measurementInputs.waist) : undefined,
        chestCm: measurementInputs.chest ? Number(measurementInputs.chest) : undefined,
        hipsCm: measurementInputs.hips ? Number(measurementInputs.hips) : undefined,
        bicepsCm: measurementInputs.biceps ? Number(measurementInputs.biceps) : undefined,
        thighCm: measurementInputs.thigh ? Number(measurementInputs.thigh) : undefined,
      });
      if (result.ok) {
        setMeasurementInputs({ waist: "", chest: "", hips: "", biceps: "", thigh: "" });
        setMeasurementsMessage("Saved.");
        router.refresh();
      } else {
        setMeasurementsMessage(result.message ?? "Couldn't save. Try again.");
      }
    });
  }

  function handlePhotoSelected(angle: PhotoAngle, file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.set("photo", file);
    setPhotoMessage("Uploading...");
    startTransition(async () => {
      const result = await uploadProgressPhoto(angle, formData);
      setPhotoMessage(result.ok ? null : result.message ?? "Couldn't upload. Try again.");
      if (result.ok) router.refresh();
    });
  }

  function handleApplySuggestion(suggestion: AdjustmentSuggestion) {
    setAdjustmentMessage(null);
    startTransition(async () => {
      const result = await applyAdjustment(
        suggestion.type,
        suggestion.suggestedDeltaKcal,
        suggestion.message
      );
      if (result.ok) {
        setDismissedTypes((prev) => [...prev, suggestion.type]);
        router.refresh();
      } else {
        setAdjustmentMessage(result.message ?? "Couldn't apply this adjustment. Try again.");
      }
    });
  }

  const visibleSuggestions = suggestions.filter((s) => !dismissedTypes.includes(s.type));
  const latestByAngle: Record<PhotoAngle, ProgressPhotoEntry | undefined> = {
    front: photos.find((p) => p.angle === "front"),
    side: photos.find((p) => p.angle === "side"),
    back: photos.find((p) => p.angle === "back"),
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {visibleSuggestions.length > 0 && (
        <section className="flex flex-col gap-3">
          {visibleSuggestions.map((s) => (
            <Card key={s.type} className="border-carbs/40 bg-carbs-soft">
              <CardContent className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-carbs">
                  Plan insight
                </p>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.message}</p>
                <p className="text-xs text-muted-foreground">
                  This only happens if you approve it.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" disabled={isPending} onClick={() => handleApplySuggestion(s)}>
                    {s.suggestedDeltaKcal > 0 ? "+" : ""}
                    {s.suggestedDeltaKcal} kcal — Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissedTypes((prev) => [...prev, s.type])}
                  >
                    Not now
                  </Button>
                </div>
                {adjustmentMessage && (
                  <p className="text-xs text-destructive">{adjustmentMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {weightSummary && (
        <Card elevated className="rounded-xl">
          <CardContent className="flex flex-col gap-4 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your progress
            </p>
            {weightSummary.currentWeightKg !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-semibold leading-none tracking-tight">
                  {weightSummary.currentWeightKg.toFixed(1)}
                  <span className="text-lg font-normal text-muted-foreground"> kg</span>
                </span>
                {weightSummary.weightLostKg !== 0 && (
                  <span
                    className={cn(
                      "tabular-data text-sm font-medium",
                      weightSummary.weightLostKg > 0 ? "text-fat" : "text-destructive"
                    )}
                  >
                    {weightSummary.weightLostKg > 0 ? "↓" : "↑"}{" "}
                    {Math.abs(weightSummary.weightLostKg).toFixed(1)} kg
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Log a weigh-in to see your trend.</p>
            )}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                <span>Goal {weightSummary.goalWeightKg.toFixed(1)} kg</span>
                <span className="tabular-data">{weightSummary.percentToGoal}% toward goal</span>
              </div>
              <Progress value={weightSummary.percentToGoal / 100} tone="calories" />
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
              <StatRow label="Lost" value={`${weightSummary.weightLostKg.toFixed(1)} kg`} />
              <StatRow label="To goal" value={`${weightSummary.weightRemainingKg.toFixed(1)} kg`} />
              <StatRow
                label={
                  weightSummary.avgKgPerWeek > 0
                    ? "Avg. loss"
                    : weightSummary.avgKgPerWeek < 0
                      ? "Avg. gain"
                      : "Avg. change"
                }
                value={
                  weightSummary.avgKgPerWeek !== 0
                    ? `${Math.abs(weightSummary.avgKgPerWeek).toFixed(2)} kg/week`
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Weight" />
        <Card>
          <CardContent>
            <WeightChart data={weightHistory} />
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Weight (kg)"
            aria-label="Weight in kilograms"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleLogWeight} disabled={isPending || !weightInput}>
            Log
          </Button>
        </div>
        {weightMessage && <p className="text-sm text-destructive">{weightMessage}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <button
          onClick={() => setMeasurementsOpen((v) => !v)}
          aria-expanded={measurementsOpen}
          className="flex min-h-11 items-center justify-between"
        >
          <h2 className="font-display text-lg font-semibold tracking-tight">Body measurements</h2>
          {measurementsOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {measurements.some((m) => m.currentCm !== null) && (
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border p-4">
            {measurements
              .filter((m) => m.currentCm !== null)
              .map((m) => (
                // No good/bad coloring on the delta here — unlike weight
                // (which has an explicit documented loss goal), a bigger or
                // smaller measurement isn't inherently "better" for every
                // field (e.g. biceps growing can be a good sign too), so
                // this stays neutral rather than implying a direction.
                <StatRow
                  key={m.key}
                  label={m.label}
                  value={`${m.currentCm} cm`}
                  delta={
                    m.deltaCm !== null
                      ? `${m.deltaCm > 0 ? "+" : ""}${m.deltaCm} cm`
                      : undefined
                  }
                />
              ))}
          </div>
        )}

        {measurementsOpen && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Waist cm"
                aria-label="Waist measurement in centimeters"
                type="number"
                value={measurementInputs.waist}
                onChange={(e) =>
                  setMeasurementInputs((m) => ({ ...m, waist: e.target.value }))
                }
              />
              <Input
                placeholder="Chest cm"
                aria-label="Chest measurement in centimeters"
                type="number"
                value={measurementInputs.chest}
                onChange={(e) =>
                  setMeasurementInputs((m) => ({ ...m, chest: e.target.value }))
                }
              />
              <Input
                placeholder="Hips cm"
                aria-label="Hips measurement in centimeters"
                type="number"
                value={measurementInputs.hips}
                onChange={(e) =>
                  setMeasurementInputs((m) => ({ ...m, hips: e.target.value }))
                }
              />
              <Input
                placeholder="Biceps cm"
                aria-label="Biceps measurement in centimeters"
                type="number"
                value={measurementInputs.biceps}
                onChange={(e) =>
                  setMeasurementInputs((m) => ({ ...m, biceps: e.target.value }))
                }
              />
              <Input
                placeholder="Thigh cm"
                aria-label="Thigh measurement in centimeters"
                type="number"
                value={measurementInputs.thigh}
                onChange={(e) =>
                  setMeasurementInputs((m) => ({ ...m, thigh: e.target.value }))
                }
              />
            </div>
            <Button onClick={handleLogMeasurements} disabled={isPending}>
              Update measurements
            </Button>
            {measurementsMessage && (
              <p className="text-xs text-muted-foreground">{measurementsMessage}</p>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Progress photos" />
        {photos.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Your transformation starts here"
            description="Take your first set of progress photos."
            action={
              <Button size="sm" onClick={() => fileInputs.front.current?.click()}>
                Add photos
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            <PhotoSlot
              angle="front"
              entry={latestByAngle.front}
              onPick={() => fileInputs.front.current?.click()}
              className="aspect-[4/3]"
            />
            <div className="grid grid-cols-2 gap-2">
              <PhotoSlot
                angle="side"
                entry={latestByAngle.side}
                onPick={() => fileInputs.side.current?.click()}
                className="aspect-[3/4]"
              />
              <PhotoSlot
                angle="back"
                entry={latestByAngle.back}
                onPick={() => fileInputs.back.current?.click()}
                className="aspect-[3/4]"
              />
            </div>
          </div>
        )}

        {PHOTO_ANGLES.map((angle) => (
          <input
            key={angle}
            ref={fileInputs[angle]}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhotoSelected(angle, e.target.files?.[0])}
          />
        ))}

        {photos.length > 0 && (
          <Button variant="outline" onClick={() => fileInputs.front.current?.click()} disabled={isPending}>
            <Camera className="size-4" /> Add update
          </Button>
        )}
        {photoMessage && <p className="text-xs text-muted-foreground">{photoMessage}</p>}
      </section>
    </div>
  );
}

function PhotoSlot({
  angle,
  entry,
  onPick,
  className,
}: {
  angle: PhotoAngle;
  entry: ProgressPhotoEntry | undefined;
  onPick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "relative flex w-full items-end overflow-hidden rounded-lg border border-border bg-muted text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      {entry?.signedUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.signedUrl}
            alt={`${angle} progress photo, logged ${entry.loggedAt}`}
            className="absolute inset-0 size-full object-cover"
          />
          <span className="relative z-10 w-full bg-gradient-to-t from-black/55 to-transparent px-2.5 py-2 text-xs font-medium capitalize text-white">
            {angle}
          </span>
        </>
      ) : (
        <div className="flex w-full flex-col items-center justify-center gap-1.5 py-6 text-muted-foreground">
          <Camera className="size-5" strokeWidth={1.75} />
          <span className="text-xs font-medium capitalize">{angle}</span>
        </div>
      )}
    </button>
  );
}
