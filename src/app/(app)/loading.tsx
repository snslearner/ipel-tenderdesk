export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
