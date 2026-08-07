export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex justify-between gap-1.5 px-4 py-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 flex-1 rounded-xl bg-muted" />
        ))}
      </div>

      <div className="mx-auto size-[200px] rounded-full bg-muted" />

      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="col-span-2 h-28 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="col-span-2 h-16 rounded-xl bg-muted" />
      </div>

      <div className="flex flex-col gap-3 px-4">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
