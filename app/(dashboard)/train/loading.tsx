import { Skeleton } from "@/components/ui/skeleton";

export default function TrainLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1 px-4 pt-6 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-6 px-4 py-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-md" />
      </div>
    </div>
  );
}
