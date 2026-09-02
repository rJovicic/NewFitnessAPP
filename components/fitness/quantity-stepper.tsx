"use client";

export function QuantityStepper({
  value,
  onChange,
  step = 10,
  min = 0,
  unit = "g",
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Decrease by ${step}${unit}`}
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-input text-lg font-medium outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
      >
        −
      </button>
      <span className="tabular-data min-w-16 text-center text-lg font-semibold">
        {value}
        {unit}
      </span>
      <button
        type="button"
        aria-label={`Increase by ${step}${unit}`}
        onClick={() => onChange(value + step)}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-input text-lg font-medium outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95"
      >
        +
      </button>
    </div>
  );
}
