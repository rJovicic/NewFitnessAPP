export default function ProgressLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6 px-4 py-4">
      <div className="h-5 w-24 rounded bg-muted" />
      <div className="h-56 rounded-xl bg-muted" />
      <div className="h-9 rounded-md bg-muted" />
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
        <div className="h-9 flex-1 rounded-md bg-muted" />
      </div>
    </div>
  );
}
