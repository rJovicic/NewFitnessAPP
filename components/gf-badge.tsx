import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type GlutenStatus = "gf_labeled" | "contains_gluten" | "unknown";

const CONFIG: Record<
  GlutenStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  gf_labeled: {
    label: "Labeled GF",
    icon: CheckCircle2,
    className: "text-fat", // sage green already in the palette
  },
  contains_gluten: {
    label: "Contains gluten",
    icon: XCircle,
    className: "text-destructive",
  },
  unknown: {
    label: "Unknown — check label",
    icon: AlertTriangle,
    className: "text-carbs", // amber
  },
};

// Never render a binary "safe/unsafe" — always one of these three states,
// per CLAUDE.md §2 (celiac is a medical constraint, not a filter toggle).
export function GfBadge({ status }: { status: GlutenStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}>
      <Icon className="size-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}
