"use client";

import { useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

// Hand-rolled bottom sheet (no Radix dialog in the dependency tree — same
// "write shadcn primitives by hand" pattern as Button/Card, per CLAUDE.md's
// known sandbox constraint). Covers what the redesign needs: a labelled,
// dismissible, focus-trapped modal surface anchored to the bottom of the
// viewport, with focus restored to whatever triggered it on close.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(open, panelRef, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in duration-200 bg-surface-overlay"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[85vh] flex-col rounded-t-2xl bg-surface-sheet shadow-sheet",
          "animate-in slide-in-from-bottom-8 duration-200"
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
