"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/use-focus-trap";

// Compact centered confirmation dialog — replaces window.confirm() for
// destructive actions (e.g. deleting a logged meal) with a real,
// accessible, on-brand modal. Cancel renders first so it also receives
// initial focus (useFocusTrap focuses the first focusable descendant),
// so a stray Enter/click doesn't accidentally confirm a destructive action.
export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(open, panelRef, onCancel);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        aria-hidden="true"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 animate-in fade-in duration-150 bg-surface-overlay"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative flex w-full max-w-xs flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-dialog animate-in zoom-in-95 duration-150"
      >
        <p id={titleId} className="text-base font-semibold">
          {title}
        </p>
        {description && (
          <p id={descId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Removing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
