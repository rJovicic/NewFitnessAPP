"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WeightChart } from "@/components/weight-chart";
import {
  logWeight,
  logBodyMeasurement,
  uploadProgressPhoto,
  applyAdjustment,
  type WeightPoint,
  type ProgressPhotoEntry,
} from "@/app/(dashboard)/progress/actions";
import type { AdjustmentSuggestion } from "@/lib/adjustment";

const PHOTO_ANGLES = ["front", "side", "back"] as const;

export function ProgressScreen({
  weightHistory,
  suggestions,
  photos,
  todayDate,
}: {
  weightHistory: WeightPoint[];
  suggestions: AdjustmentSuggestion[];
  photos: ProgressPhotoEntry[];
  todayDate: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weightInput, setWeightInput] = useState("");
  const [weightMessage, setWeightMessage] = useState<string | null>(null);

  const [measurementsOpen, setMeasurementsOpen] = useState(false);
  const [measurements, setMeasurements] = useState({
    waist: "",
    chest: "",
    hips: "",
    biceps: "",
    thigh: "",
  });
  const [measurementsMessage, setMeasurementsMessage] = useState<string | null>(null);

  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [dismissedTypes, setDismissedTypes] = useState<string[]>([]);
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
        waistCm: measurements.waist ? Number(measurements.waist) : undefined,
        chestCm: measurements.chest ? Number(measurements.chest) : undefined,
        hipsCm: measurements.hips ? Number(measurements.hips) : undefined,
        bicepsCm: measurements.biceps ? Number(measurements.biceps) : undefined,
        thighCm: measurements.thigh ? Number(measurements.thigh) : undefined,
      });
      if (result.ok) {
        setMeasurements({ waist: "", chest: "", hips: "", biceps: "", thigh: "" });
        setMeasurementsMessage("Saved.");
      } else {
        setMeasurementsMessage(result.message ?? "Couldn't save. Try again.");
      }
    });
  }

  function handlePhotoSelected(angle: (typeof PHOTO_ANGLES)[number], file: File | undefined) {
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
    startTransition(async () => {
      await applyAdjustment(suggestion.type, suggestion.suggestedDeltaKcal, suggestion.message);
      setDismissedTypes((prev) => [...prev, suggestion.type]);
      router.refresh();
    });
  }

  const visibleSuggestions = suggestions.filter((s) => !dismissedTypes.includes(s.type));

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {visibleSuggestions.length > 0 && (
        <section className="flex flex-col gap-3">
          {visibleSuggestions.map((s) => (
            <Card key={s.type} className="border-carbs/50 bg-carbs/5">
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.message}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleApplySuggestion(s)}
                  >
                    {s.suggestedDeltaKcal > 0 ? "+" : ""}
                    {s.suggestedDeltaKcal} kcal — Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissedTypes((prev) => [...prev, s.type])}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Weight</h2>
        <Card>
          <CardContent>
            <WeightChart data={weightHistory} />
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Weight (kg)"
            aria-label="Weight in kilograms"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
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
          className="flex items-center justify-between"
        >
          <h2 className="font-display text-lg font-semibold">Body measurements</h2>
          {measurementsOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        {measurementsOpen && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Waist cm"
                aria-label="Waist measurement in centimeters"
                type="number"
                value={measurements.waist}
                onChange={(e) => setMeasurements((m) => ({ ...m, waist: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                placeholder="Chest cm"
                aria-label="Chest measurement in centimeters"
                type="number"
                value={measurements.chest}
                onChange={(e) => setMeasurements((m) => ({ ...m, chest: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                placeholder="Hips cm"
                aria-label="Hips measurement in centimeters"
                type="number"
                value={measurements.hips}
                onChange={(e) => setMeasurements((m) => ({ ...m, hips: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                placeholder="Biceps cm"
                aria-label="Biceps measurement in centimeters"
                type="number"
                value={measurements.biceps}
                onChange={(e) => setMeasurements((m) => ({ ...m, biceps: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <input
                placeholder="Thigh cm"
                aria-label="Thigh measurement in centimeters"
                type="number"
                value={measurements.thigh}
                onChange={(e) => setMeasurements((m) => ({ ...m, thigh: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <Button size="sm" onClick={handleLogMeasurements} disabled={isPending}>
              Save measurements
            </Button>
            {measurementsMessage && (
              <p className="text-xs text-muted-foreground">{measurementsMessage}</p>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Progress photos</h2>
        <div className="flex gap-2">
          {PHOTO_ANGLES.map((angle) => (
            <div key={angle} className="flex-1">
              <input
                ref={fileInputs[angle]}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoSelected(angle, e.target.files?.[0])}
              />
              <Button
                variant="outline"
                className="w-full capitalize"
                onClick={() => fileInputs[angle].current?.click()}
                disabled={isPending}
              >
                <Camera className="size-4" /> {angle}
              </Button>
            </div>
          ))}
        </div>
        {photoMessage && <p className="text-xs text-muted-foreground">{photoMessage}</p>}
        {photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {photos.map((p) =>
              p.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.signedUrl}
                  alt={`${p.angle} progress photo, ${p.loggedAt}`}
                  className="h-24 w-20 shrink-0 rounded-md object-cover"
                />
              ) : null
            )}
          </div>
        )}
      </section>
    </div>
  );
}
