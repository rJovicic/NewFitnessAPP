import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1 px-4 pt-6 pb-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex flex-col gap-6 px-4 py-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-56 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="h-11 w-16 rounded-md" />
        </div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
