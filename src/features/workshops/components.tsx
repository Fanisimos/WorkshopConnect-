import type { ReactNode } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { formatTimeRange } from "@/lib/dates";

import type { WorkshopPhase } from "./phase";
import type { WorkshopStatus } from "./schema";

const STATUS: Record<WorkshopStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "brand" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/** Organiser-facing lifecycle status. */
export function StatusBadge({ status }: { status: WorkshopStatus }) {
  const { label, tone } = STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const PHASE: Record<WorkshopPhase, { label: string; tone: BadgeTone }> = {
  upcoming: { label: "Upcoming", tone: "brand" },
  live: { label: "Happening now", tone: "live" },
  ended: { label: "Ended", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/** Student-facing timing. */
export function PhaseBadge({ phase }: { phase: WorkshopPhase }) {
  const { label, tone } = PHASE[phase];
  return (
    <Badge tone={tone}>
      {phase === "live" && <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />}
      {label}
    </Badge>
  );
}

export function TopicChips({ topics }: { topics: string[] }) {
  if (!topics.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Focus topics">
      {topics.map((topic) => (
        <li key={topic} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {topic}
        </li>
      ))}
    </ul>
  );
}

function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-ink-muted">
      <span className="mt-0.5 text-slate-400" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "size-4",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const CalendarIcon = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const PinIcon = (
  <svg {...iconProps}>
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const PersonIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

/** Date/time, location and (optionally) host, with icons. */
export function WorkshopMeta({
  startsAt,
  endsAt,
  location,
  host,
}: {
  startsAt: string;
  endsAt: string;
  location: string;
  host?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <MetaRow icon={CalendarIcon}>
        <time dateTime={startsAt}>{formatTimeRange(startsAt, endsAt)}</time>
      </MetaRow>
      <MetaRow icon={PinIcon}>{location}</MetaRow>
      {host && <MetaRow icon={PersonIcon}>Hosted by {host}</MetaRow>}
    </div>
  );
}
