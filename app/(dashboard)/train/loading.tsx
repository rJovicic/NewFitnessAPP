export default function TrainLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6 px-4 py-4">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-9 rounded-md bg-muted" />
    </div>
  );
}
