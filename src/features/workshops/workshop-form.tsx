"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState, type FormState } from "@/lib/forms";

import { MAX_FOCUS_TOPICS } from "./schema";

export type WorkshopFormDefaults = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  focusTopics: string;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  mode: "create" | "edit";
  defaults?: Partial<WorkshopFormDefaults>;
  cancelHref: string;
};

export function WorkshopForm({ action, mode, defaults, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialFormState);
  // After a failed submit, show what the user typed rather than the original values.
  const v = { ...defaults, ...state.values } as Partial<WorkshopFormDefaults>;
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {Object.keys(err).length > 0 && !state.message && (
        <Alert tone="error">Please fix the highlighted fields.</Alert>
      )}

      <Field id="title" label="Title" errors={err.title}>
        {(aria) => <Input {...aria} name="title" required maxLength={120} defaultValue={v.title} placeholder="e.g. SQL for Beginners" />}
      </Field>

      <Field id="description" label="Description" optional errors={err.description} hint="What will students learn? Any preparation needed?">
        {(aria) => <Textarea {...aria} name="description" rows={4} maxLength={2000} defaultValue={v.description} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="date" label="Date" errors={err.date}>
          {(aria) => <Input {...aria} name="date" type="date" required defaultValue={v.date} />}
        </Field>
        <Field id="startTime" label="Start time" errors={err.startTime}>
          {(aria) => <Input {...aria} name="startTime" type="time" required defaultValue={v.startTime} />}
        </Field>
        <Field id="endTime" label="End time" errors={err.endTime}>
          {(aria) => <Input {...aria} name="endTime" type="time" required defaultValue={v.endTime} />}
        </Field>
      </div>
      <p className="-mt-3 text-xs text-ink-muted">Times are UK time (GMT/BST).</p>

      <Field id="location" label="Location" errors={err.location}>
        {(aria) => <Input {...aria} name="location" required maxLength={120} defaultValue={v.location} placeholder="e.g. Penrhyn Road, Room JG2003" />}
      </Field>

      <Field
        id="focusTopics"
        label="Focus topics"
        optional
        errors={err.focusTopics}
        hint={`Up to ${MAX_FOCUS_TOPICS}, separated by commas. Students choose from these when telling you what they need more help with.`}
      >
        {(aria) => <Input {...aria} name="focusTopics" defaultValue={v.focusTopics} placeholder="e.g. SQL JOINs, GROUP BY, Subqueries" />}
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="ghost">
          Cancel
        </ButtonLink>
        {mode === "create" ? (
          <>
            <SubmitButton variant="secondary" name="status" value="draft" pendingText="Saving…">
              Save as draft
            </SubmitButton>
            <SubmitButton name="status" value="published" pendingText="Publishing…">
              Publish workshop
            </SubmitButton>
          </>
        ) : (
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        )}
      </div>
    </form>
  );
}
