"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 p-6">
      <h1 className="font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
