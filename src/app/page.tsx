import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser, homePathFor } from "@/lib/auth";

const steps = [
  {
    title: "Check in",
    body: "Students scan the workshop QR code with their phone camera. One tap and attendance is recorded.",
  },
  {
    title: "Share feedback",
    body: "Rate the session and complete a 30-second Learning Pulse on how confident you feel now.",
  },
  {
    title: "Ask for support",
    body: "Name the topic you'd like more help with and request extra learning resources.",
  },
  {
    title: "Close the loop",
    body: "Organisers see common learning needs, share resources and mark requests as fulfilled.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Brand />
        <ButtonLink href="/login" variant="ghost">
          Log in
        </ButtonLink>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-16 sm:pt-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">Skills workshops, followed through</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            From attendance to the support students actually need.
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Workshop Connect+ links check-in, feedback and learning needs, so organisers can see who needs more
            help with what, and follow up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Create a student account
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              Log in
            </ButtonLink>
          </div>
        </div>

        <ol className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800">
                {i + 1}
              </span>
              <h2 className="mt-3 font-semibold text-ink">{step.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-ink-muted">
        Workshop Connect+ · Kingston University coursework prototype
      </footer>
    </div>
  );
}
