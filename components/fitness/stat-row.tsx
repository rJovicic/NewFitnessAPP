import { cn } from "@/lib/utils";

export function StatRow({
  label,
  value,
  delta,
  deltaTone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "neutral";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular-data text-lg font-semibold">{value}</p>
      {delta && (
        <p
          className={cn(
            "tabular-data text-xs font-medium",
            deltaTone === "good" && "text-fat",
            deltaTone === "bad" && "text-destructive",
            deltaTone === "neutral" && "text-muted-foreground"
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
