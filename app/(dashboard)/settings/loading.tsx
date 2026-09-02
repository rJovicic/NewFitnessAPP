import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-6 pb-2">
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="flex flex-col gap-6 px-4 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
