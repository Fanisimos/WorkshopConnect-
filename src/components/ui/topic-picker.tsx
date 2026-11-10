"use client";

import { useState } from "react";

import { Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/**
 * Pick one of the workshop's focus topics, or type your own.
 * Sends "topic" (the chip) and "topicOther" (free text); the server prefers
 * the free text when both are present (see lib/topics.ts chosenTopic).
 */
export function TopicPicker({
  legend,
  description,
  topics,
  defaultTopic,
  defaultOther,
  errors,
}: {
  legend: string;
  description?: string;
  topics: string[];
  defaultTopic?: string;
  defaultOther?: string;
  errors?: string[];
}) {
  const [selected, setSelected] = useState(defaultTopic ?? (defaultOther ? "__other" : ""));
  const showOther = topics.length === 0 || selected === "__other";
  const errorId = errors?.length ? "topic-error" : undefined;

  const chip = (value: string, label: string) => (
    <label key={value} className="relative">
      <input
        type="radio"
        name="topic"
        value={value}
        checked={selected === value}
        onChange={() => setSelected(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-sm transition-colors",
          "border-line bg-white text-ink hover:border-brand-500",
          "peer-checked:border-brand-700 peer-checked:bg-brand-50 peer-checked:font-medium peer-checked:text-brand-800",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2",
        )}
      >
        {label}
      </span>
    </label>
  );

  return (
    <fieldset aria-describedby={errorId}>
      <legend className="text-sm font-medium text-ink">
        {legend} <span className="font-normal text-ink-muted">(optional)</span>
      </legend>
      {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}

      {topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chip("", "Nothing specific")}
          {topics.map((t) => chip(t, t))}
          {chip("__other", "Something else…")}
        </div>
      )}

      {showOther && (
        <div className="mt-3">
          <label htmlFor="topicOther" className="sr-only">
            Topic
          </label>
          <Input
            id="topicOther"
            name="topicOther"
            maxLength={80}
            defaultValue={defaultOther}
            placeholder="e.g. SQL JOINs"
            aria-invalid={Boolean(errorId)}
            aria-describedby={errorId}
          />
        </div>
      )}
      {errorId && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {errors![0]}
        </p>
      )}
    </fieldset>
  );
}
