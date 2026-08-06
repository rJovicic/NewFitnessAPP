// Persistent disclaimer required by CLAUDE.md §2 — cross-contamination
// isn't tracked by any database; label-checking is on the user.
export function GfDisclaimer() {
  return (
    <p className="text-xs text-muted-foreground">
      GF status comes from product labels, not lab testing. Cross-contamination
      isn&apos;t tracked here — always check the label yourself.
    </p>
  );
}
