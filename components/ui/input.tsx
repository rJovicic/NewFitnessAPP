import * as React from "react";
import { cn } from "@/lib/utils";

// Shared 44px-tall text input — mobile forms use this instead of ad hoc
// h-9 inputs so touch targets and focus rings stay consistent app-wide.
function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-md border border-input bg-background px-3.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
