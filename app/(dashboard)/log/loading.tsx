export default function LogLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6 px-4 py-4">
      <div className="h-5 w-32 rounded bg-muted" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-muted" />
      ))}
      <div className="h-9 rounded-md bg-muted" />
    </div>
  );
}
