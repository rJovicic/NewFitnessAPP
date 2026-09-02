import { Skeleton } from "@/components/ui/skeleton";

export default function MoodLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1 px-4 pt-6 pb-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col items-center gap-6 px-4 py-10">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-14 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
