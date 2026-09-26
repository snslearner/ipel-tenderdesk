"use client";

import { Button } from "@/components/ui/button";

// Catches errors thrown while building the app shell (e.g. profile or role lookup failed).
export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div role="alert" className="w-full max-w-sm space-y-3 rounded-lg border border-destructive/40 p-6">
        <h1 className="font-semibold">Could not load IPEL TenderDesk</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
