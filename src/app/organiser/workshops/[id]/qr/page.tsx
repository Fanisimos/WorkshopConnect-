import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { checkInUrl, checkInWindow } from "@/features/attendance/check-in-result";
import { qrSvg } from "@/features/attendance/qr";
import { getWorkshopToken } from "@/features/attendance/queries";
import { getOrganiserWorkshop } from "@/features/workshops/queries";
import { requireRole } from "@/lib/auth";
import { formatTime, formatTimeRange } from "@/lib/dates";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Check-in QR code" };

/** Large QR code to project or show at the start of a workshop. */
export default async function WorkshopQrPage({ params }: PageProps<"/organiser/workshops/[id]/qr">) {
  const { id } = await params;
  const user = await requireRole("organiser");
  const workshop = await getOrganiserWorkshop(id, user.id);
  if (!workshop) notFound();
  const token = await getWorkshopToken(workshop.id);
  if (!token) notFound();

  const url = checkInUrl(env.siteUrl, token);
  const svg = await qrSvg(url);
  const { opensAt, closesAt } = checkInWindow(workshop.starts_at, workshop.ends_at);
  const isLocalhost = /\/\/(localhost|127\.0\.0\.1)/.test(env.siteUrl);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href={`/organiser/workshops/${workshop.id}`} className="text-ink-muted hover:text-ink">
          ← Back to workshop
        </Link>
      </nav>

      {workshop.status !== "published" && (
        <Alert tone="warning" title="Check-in is closed">
          This workshop is {workshop.status}. Students can only check in to published workshops.
        </Alert>
      )}
      {isLocalhost && (
        <Alert tone="warning" title="Development link">
          This QR code points to {env.siteUrl}, which phones can&apos;t open. Use the deployed site for real check-ins.
        </Alert>
      )}

      <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">Scan to check in</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{workshop.title}</h1>
        <p className="mt-1 text-ink-muted">{formatTimeRange(workshop.starts_at, workshop.ends_at)} · {workshop.location}</p>

        <div
          className="mx-auto mt-6 w-full max-w-[min(80vw,28rem)] [&>svg]:h-auto [&>svg]:w-full"
          role="img"
          aria-label={`QR code linking to ${url}`}
          // SVG generated server-side by the qrcode library from our own URL.
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="mt-4 text-sm text-ink-muted">
          Open your phone camera and point it at the code. Check-in is open {formatTime(opensAt.toISOString())}–
          {formatTime(closesAt.toISOString())}.
        </p>
        <p className="mt-2 font-mono text-xs break-all text-slate-500">{url}</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={`/organiser/workshops/${workshop.id}/qr/download`} className={buttonClasses("secondary")} download>
          Download PNG
        </a>
        <Link href={`/organiser/workshops/${workshop.id}`} className={buttonClasses("ghost")}>
          View attendance
        </Link>
      </div>

      <p className="text-center text-xs text-ink-muted">
        Note: a QR code confirms a student opened this link while logged in, not that they were physically present.
      </p>
    </div>
  );
}
