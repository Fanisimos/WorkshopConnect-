import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-1 text-xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-muted">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        Go home
      </ButtonLink>
    </main>
  );
}
