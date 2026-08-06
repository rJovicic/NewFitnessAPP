import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">New Fitness App</h1>
      <p className="text-muted-foreground">Phase 0 bootstrap — Robert&apos;s tracker.</p>
      <Button>shadcn/ui wired up</Button>
    </div>
  );
}
