// Empty state for screens that later steps will build.
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nothing here yet. This screen is built in a later step.
      </div>
    </div>
  );
}
