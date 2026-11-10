import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Brand } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { checkIn, getMyCheckIn } from "@/features/attendance/queries";
import { homePathFor, requireUser } from "@/lib/auth";
import { formatDateTime, formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Check in" };

/**
 * QR destination. Opening this page while logged in checks the student in.
 * Safe to run on page load: it needs a logged-in session, the database makes
 * it idempotent (UNIQUE constraint), and repeat visits just show
 * "already checked in". Logged-out visitors are sent to /login by the proxy
 * and returned here afterwards.
 */
export default async function CheckInPage({ params }: PageProps<"/check-in/[token]">) {
  const { token } = await params;
  const user = await requireUser();
  const result = await checkIn(token);

  const checkedInAt =
    result.workshop_id && (result.status === "checked_in" || result.status === "already_checked_in")
      ? await getMyCheckIn(result.workshop_id)
      : null;

  const workshopHref = result.workshop_id ? `/workshops/${result.workshop_id}` : "/workshops";
  const title = result.workshop_title;

  let view: ReactNode;
  switch (result.status) {
    case "checked_in":
      view = (
        <ResultCard tone="success" icon={<TickIcon />} heading="You're checked in" title={title}>
          <p>{checkedInAt ? `Recorded at ${formatTime(checkedInAt)}.` : "Your attendance has been recorded."} Enjoy the workshop!</p>
          <p className="mt-2">Afterwards, you can give feedback and ask for extra resources from the workshop page.</p>
          <ButtonLink href={workshopHref} size="lg" className="mt-6 w-full">
            Go to workshop
          </ButtonLink>
        </ResultCard>
      );
      break;
    case "already_checked_in":
      view = (
        <ResultCard tone="info" icon={<TickIcon />} heading="Already checked in" title={title}>
          <p>
            {checkedInAt ? `You checked in on ${formatDateTime(checkedInAt)}.` : "You've already checked in to this workshop."} No
            need to scan again.
          </p>
          <ButtonLink href={workshopHref} size="lg" className="mt-6 w-full">
            Go to workshop
          </ButtonLink>
        </ResultCard>
      );
      break;
    case "closed":
      view = (
        <ResultCard tone="warning" icon={<ClockIcon />} heading="Check-in isn't open" title={title}>
          <p>
            Check-in opens 30 minutes before the workshop starts and closes 60 minutes after it ends. It may also be closed
            because the workshop was cancelled.
          </p>
          <ButtonLink href={workshopHref} variant="secondary" size="lg" className="mt-6 w-full">
            View workshop details
          </ButtonLink>
        </ResultCard>
      );
      break;
    case "not_student":
      view = (
        <ResultCard tone="info" icon={<InfoIcon />} heading="Organiser account" title={title}>
          <p>Only student accounts can check in. This QR code is working: students who scan it will be checked in.</p>
          <ButtonLink href={homePathFor(user.role)} variant="secondary" size="lg" className="mt-6 w-full">
            Back to dashboard
          </ButtonLink>
        </ResultCard>
      );
      break;
    default:
      view = (
        <ResultCard tone="error" icon={<CrossIcon />} heading="This check-in code isn't valid">
          <p>The link may be incomplete or out of date. Try scanning the QR code again, or ask the organiser for help.</p>
          <ButtonLink href="/workshops" variant="secondary" size="lg" className="mt-6 w-full">
            Browse workshops
          </ButtonLink>
        </ResultCard>
      );
  }

  return (
    <main className="flex min-h-full flex-1 flex-col items-center px-4 py-8 sm:justify-center">
      <div className="mb-8">
        <Brand href={homePathFor(user.role)} />
      </div>
      <div className="w-full max-w-md">{view}</div>
      <p className="mt-6 text-center text-xs text-ink-muted">Signed in as {user.fullName}</p>
    </main>
  );
}

const TONES = {
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-brand-100 text-brand-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

function ResultCard({
  tone,
  icon,
  heading,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  heading: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section
      role={tone === "error" ? "alert" : "status"}
      className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm sm:p-8"
    >
      <div className={cn("mx-auto grid size-16 place-items-center rounded-full", TONES[tone])}>{icon}</div>
      <h1 className="mt-4 text-xl font-semibold text-ink">{heading}</h1>
      {title && <p className="mt-1 font-medium text-brand-800">{title}</p>}
      <div className="mt-3 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

const svg = {
  viewBox: "0 0 24 24",
  className: "size-8",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
const TickIcon = () => (
  <svg {...svg}>
    <path d="M5 12.5 10 17 19 7" />
  </svg>
);
const CrossIcon = () => (
  <svg {...svg}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const ClockIcon = () => (
  <svg {...svg}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const InfoIcon = () => (
  <svg {...svg}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
