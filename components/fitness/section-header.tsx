import type { ReactNode } from "react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
