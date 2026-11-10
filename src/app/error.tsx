"use client";

import { Button, ButtonLink } from "@/components/ui/button";

/** Shown when a page or Server Action throws. Never displays internal error details. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-muted">
        We couldn&apos;t complete that request. It may be something you don&apos;t have permission to do, or a temporary
        problem.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </main>
  );
}
