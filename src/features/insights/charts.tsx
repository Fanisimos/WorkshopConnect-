/**
 * Minimal server-rendered charts (HTML + CSS, no chart library).
 * Following the project's dataviz rules: thin bars (<= 12px here), 4px
 * rounded data-end, square at the baseline, values printed as text (so the
 * chart doubles as its own table), native `title` tooltips on hover, and
 * colours validated for colour-blind separation and contrast:
 *   single series  → brand indigo #4338ca
 *   before / now   → cyan #0891b2 / indigo #4338ca (validated pair)
 */

export const SERIES = {
  single: "#4338ca",
  before: "#0891b2",
  after: "#4338ca",
} as const;

type Bar = { label: string; value: number; hint?: string };

/** Horizontal bar list: label · bar · value. Magnitude of one series. */
export function BarList({
  bars,
  max,
  caption,
  valueSuffix = "",
}: {
  bars: Bar[];
  max?: number;
  caption: string;
  valueSuffix?: string;
}) {
  const top = max ?? Math.max(1, ...bars.map((b) => b.value));
  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="space-y-2">
        {bars.map((b) => (
          <li
            key={b.label}
            className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,10rem)_1fr_auto]"
            title={`${b.label}: ${b.value}${valueSuffix}${b.hint ? ` (${b.hint})` : ""}`}
          >
            <span className="truncate text-ink-muted">{b.label}</span>
            <span className="h-3 rounded-r bg-slate-100" aria-hidden="true">
              <span
                className="block h-3 rounded-r"
                style={{ width: `${(b.value / top) * 100}%`, backgroundColor: SERIES.single, minWidth: b.value ? 4 : 0 }}
              />
            </span>
            <span className="w-8 text-right font-medium text-ink tabular-nums">
              {b.value}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Average confidence before vs now, on the 1–5 scale. Labels carry identity (not colour alone). */
export function ConfidenceComparison({ before, after }: { before: number; after: number }) {
  const rows = [
    { label: "Before (looking back)", value: before, color: SERIES.before },
    { label: "Now", value: after, color: SERIES.after },
  ];
  return (
    <figure>
      <figcaption className="sr-only">
        Average self-reported confidence: before {before.toFixed(1)} out of 5, now {after.toFixed(1)} out of 5.
      </figcaption>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="space-y-1" title={`${r.label}: ${r.value.toFixed(1)} / 5`}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-muted">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: r.color }} aria-hidden="true" />
                {r.label}
              </span>
              <span className="font-medium text-ink tabular-nums">{r.value.toFixed(1)} / 5</span>
            </div>
            <span className="block h-3 rounded-r bg-slate-100" aria-hidden="true">
              <span className="block h-3 rounded-r" style={{ width: `${(r.value / 5) * 100}%`, backgroundColor: r.color }} />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex justify-between text-[11px] text-ink-muted" aria-hidden="true">
        <span>0</span>
        <span>5 · very confident</span>
      </div>
    </figure>
  );
}
