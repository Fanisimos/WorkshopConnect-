import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-lg border bg-white px-3 text-sm text-ink shadow-sm placeholder:text-slate-400 " +
  "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50";

function controlClasses(invalid: boolean, className?: string) {
  return cn(control, invalid ? "border-red-600" : "border-line", className);
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  optional?: boolean;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
};

/**
 * Label + control + hint + error, wired together for screen readers.
 * The control is rendered via a render prop so it receives the right ARIA attributes.
 */
export function Field({ id, label, hint, errors, optional, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-muted">(optional)</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(errorId), "aria-describedby": describedBy })}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {errorId && (
        <p id={errorId} className="text-sm text-red-700">
          {errors![0]}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={controlClasses(Boolean(props["aria-invalid"]), cn("h-10", className))} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={controlClasses(Boolean(props["aria-invalid"]), cn("py-2", className))} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={controlClasses(Boolean(props["aria-invalid"]), cn("h-10", className))} {...props} />;
}
