import * as React from "react";
import { cn } from "@/lib/utils";

// Default radius is the "ordinary container" tier (rounded-lg, 18px) —
// reserve rounded-xl (26px, the hero tier) for the one or two genuinely
// hero surfaces per screen (pass it via className). Card itself stays a
// deliberately plain primitive; most information on a screen shouldn't
// reach for it at all — see the art-direction note atop globals.css.
function Card({
  className,
  elevated = false,
  ...props
}: React.ComponentProps<"div"> & { elevated?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        elevated ? "border-transparent shadow-hero" : "shadow-none",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("p-4", className)} {...props} />
  );
}

export { Card, CardContent };
