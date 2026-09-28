"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getBookingUrl } from "@/lib/calendar";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="font-heading text-3xl text-ink">Avery hit a snag</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The chat couldn&apos;t load. You can try again, or book a call and a teammate will
          cover your questions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" className="h-11 rounded-full px-4" onClick={() => reset()}>
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full bg-card px-4"
            onClick={() => window.open(getBookingUrl(), "_blank", "noopener,noreferrer")}
          >
            Book a call
          </Button>
        </div>
      </div>
    </main>
  );
}
