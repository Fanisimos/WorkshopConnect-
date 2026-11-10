import { Badge, type BadgeTone } from "@/components/ui/badge";

import type { RequestStatus } from "./queries";

const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warning" },
  in_progress: { label: "In progress", tone: "brand" },
  fulfilled: { label: "Fulfilled", tone: "success" },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { label, tone } = REQUEST_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** External learning link. Opens in a new tab; rel prevents the target page controlling ours. */
export function ResourceLink({ title, url, topic }: { title: string; url: string; topic?: string | null }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // keep raw url
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-line bg-white p-3 hover:border-brand-500 hover:bg-brand-50/40"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-700" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-ink group-hover:text-brand-800">
          {title}
          <span className="sr-only"> (opens in a new tab)</span>
        </span>
        <span className="block truncate text-xs text-ink-muted">
          {host}
          {topic ? ` · ${topic}` : ""}
        </span>
      </span>
    </a>
  );
}

/** Read-only 1–5 score, e.g. after a student has submitted. */
export function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-lg font-semibold text-ink tabular-nums">
        {value}
        <span className="text-sm font-normal text-ink-muted">/5</span>
      </p>
    </div>
  );
}
