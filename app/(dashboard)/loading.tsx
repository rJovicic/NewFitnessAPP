import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 px-4 pt-6 pb-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="flex justify-between gap-1.5 px-4 py-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 flex-1 rounded-full" />
        ))}
      </div>

      <div className="mx-4 rounded-xl border border-border p-5">
        <Skeleton className="mx-auto size-[208px] rounded-full" />
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
