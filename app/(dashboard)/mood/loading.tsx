export default function MoodLoading() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-6 px-4 py-12">
      <div className="size-8 rounded-full bg-muted" />
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="size-10 rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}
