import { cn } from "@/lib/utils";

/**
 * 1–5 scale as native radio buttons (keyboard: Tab to the group, arrows to
 * choose). Styled as a row of large tap targets for phones.
 */
export function ScaleInput({
  name,
  legend,
  description,
  lowLabel,
  highLabel,
  defaultValue,
  errors,
}: {
  name: string;
  legend: string;
  description?: string;
  lowLabel: string;
  highLabel: string;
  defaultValue?: string;
  errors?: string[];
}) {
  const errorId = errors?.length ? `${name}-error` : undefined;
  const descId = description ? `${name}-desc` : undefined;

  return (
    <fieldset aria-describedby={[descId, errorId].filter(Boolean).join(" ") || undefined}>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      {description && (
        <p id={descId} className="mt-0.5 text-xs text-ink-muted">
          {description}
        </p>
      )}
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={name}
              value={n}
              defaultChecked={defaultValue === String(n)}
              required
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center rounded-lg border bg-white text-base font-semibold text-ink transition-colors",
                "hover:border-brand-500 peer-checked:border-brand-700 peer-checked:bg-brand-700 peer-checked:text-white",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2",
                errorId ? "border-red-600" : "border-line",
              )}
            >
              {n}
            </span>
            <span className="sr-only">
              {n === 1 ? ` (${lowLabel})` : n === 5 ? ` (${highLabel})` : ""}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-muted" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      {errorId && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {errors![0]}
        </p>
      )}
    </fieldset>
  );
}
