"use client";

import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms";

import { addResource, fulfilRequest } from "./actions";

/** Share a learning link for a workshop; optionally fulfil open requests on the same topic. */
export function ResourceForm({
  workshopId,
  defaultTopic,
  openMatching,
  topics,
}: {
  workshopId: string;
  defaultTopic?: string;
  /** open requests whose topic matches defaultTopic (shown on the checkbox) */
  openMatching?: number;
  topics: string[];
}) {
  const [state, action] = useActionState(addResource, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.ok ? {} : (state.values ?? {});

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="workshopId" value={workshopId} />
      {state.message && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Field id="res-title" label="Title" errors={state.fieldErrors?.title}>
        {(aria) => <Input {...aria} name="title" required maxLength={120} defaultValue={v.title} placeholder="e.g. SQL JOINs explained with examples" />}
      </Field>
      <Field id="res-url" label="Link" errors={state.fieldErrors?.url} hint="Must start with https://">
        {(aria) => <Input {...aria} name="url" type="url" inputMode="url" required defaultValue={v.url} placeholder="https://" />}
      </Field>
      <Field id="res-topic" label="Topic" optional errors={state.fieldErrors?.topic} hint="Links this resource to a learning need.">
        {(aria) => (
          <>
            <Input {...aria} name="topic" maxLength={80} list="res-topic-options" defaultValue={v.topic ?? defaultTopic} />
            <datalist id="res-topic-options">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      {Boolean(openMatching) && (
        <label className="flex items-start gap-3 rounded-lg border border-line bg-slate-50 p-3 text-sm">
          <input type="checkbox" name="fulfilMatching" defaultChecked className="mt-0.5 size-4 accent-brand-700" />
          <span>
            Also mark the <strong>{openMatching}</strong> open {openMatching === 1 ? "request" : "requests"} about this topic as
            fulfilled with this resource.
          </span>
        </label>
      )}
      <SubmitButton pendingText="Sharing…">Share resource</SubmitButton>
    </form>
  );
}

/** Respond to one request: pick an existing resource, add a new link, and/or write a note. */
export function FulfilForm({
  requestId,
  resources,
}: {
  requestId: string;
  resources: { id: string; title: string }[];
}) {
  const [state, action] = useActionState(fulfilRequest, initialFormState);
  const pathname = usePathname();
  const v = state.values ?? {};
  const e = state.fieldErrors ?? {};
  const id = (name: string) => `${name}-${requestId}`;

  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="returnTo" value={pathname} />
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {resources.length > 0 && (
        <Field id={id("resourceId")} label="Share an existing resource" optional errors={e.resourceId}>
          {(aria) => (
            <Select {...aria} name="resourceId" defaultValue={v.resourceId ?? ""}>
              <option value="">None</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={id("newTitle")} label={resources.length ? "…or add a new link: title" : "New link: title"} optional errors={e.newTitle}>
          {(aria) => <Input {...aria} name="newTitle" maxLength={120} defaultValue={v.newTitle} />}
        </Field>
        <Field id={id("newUrl")} label="Link" optional errors={e.newUrl}>
          {(aria) => <Input {...aria} name="newUrl" type="url" inputMode="url" placeholder="https://" defaultValue={v.newUrl} />}
        </Field>
      </div>
      <Field id={id("note")} label="Note to the student" optional errors={e.note}>
        {(aria) => <Textarea {...aria} name="note" rows={2} maxLength={500} defaultValue={v.note} />}
      </Field>
      <SubmitButton pendingText="Saving…">Mark as fulfilled</SubmitButton>
    </form>
  );
}
