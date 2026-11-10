"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Field, Textarea } from "@/components/ui/form";
import { ScaleInput } from "@/components/ui/scale-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { TopicPicker } from "@/components/ui/topic-picker";
import { initialFormState } from "@/lib/forms";

import { createRequest, submitFeedback, submitPulse } from "./actions";

export function FeedbackForm({ workshopId }: { workshopId: string }) {
  const [state, action] = useActionState(submitFeedback, initialFormState);
  if (state.ok) return <Alert tone="success">Thanks for your feedback!</Alert>;
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="workshopId" value={workshopId} />
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <ScaleInput
        name="rating"
        legend="How would you rate this workshop?"
        lowLabel="Poor"
        highLabel="Excellent"
        defaultValue={v.rating}
        errors={state.fieldErrors?.rating}
      />
      <Field id="comment" label="Comments" optional errors={state.fieldErrors?.comment} hint="What worked well? What could be better?">
        {(aria) => <Textarea {...aria} name="comment" rows={3} maxLength={1000} defaultValue={v.comment} />}
      </Field>
      <SubmitButton pendingText="Sending…">Submit feedback</SubmitButton>
    </form>
  );
}

export function PulseForm({ workshopId, topics }: { workshopId: string; topics: string[] }) {
  const [state, action] = useActionState(submitPulse, initialFormState);
  if (state.ok) return <Alert tone="success">Learning Pulse saved. Thank you!</Alert>;
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="workshopId" value={workshopId} />
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <ScaleInput
        name="confidenceBefore"
        legend="Looking back, how confident were you with this topic before the workshop?"
        description="Your own estimate, made now."
        lowLabel="Not at all"
        highLabel="Very confident"
        defaultValue={v.confidenceBefore}
        errors={state.fieldErrors?.confidenceBefore}
      />
      <ScaleInput
        name="confidenceAfter"
        legend="How confident do you feel now?"
        lowLabel="Not at all"
        highLabel="Very confident"
        defaultValue={v.confidenceAfter}
        errors={state.fieldErrors?.confidenceAfter}
      />
      <TopicPicker
        legend="Which topic would you like more help understanding?"
        description="Organisers see topics grouped across students; their dashboard doesn’t show your name next to them."
        topics={topics}
        defaultTopic={v.topic}
        defaultOther={v.topicOther}
        errors={state.fieldErrors?.topicOther ?? state.fieldErrors?.topic}
      />
      <SubmitButton pendingText="Saving…">Save Learning Pulse</SubmitButton>
    </form>
  );
}

export function RequestForm({ workshopId, topics }: { workshopId: string; topics: string[] }) {
  const [state, action] = useActionState(createRequest, initialFormState);
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="workshopId" value={workshopId} />
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <TopicPicker legend="Topic" topics={topics} defaultTopic={v.topic} defaultOther={v.topicOther} errors={state.fieldErrors?.topicOther} />
      <Field
        id="description"
        label="What would help you?"
        errors={state.fieldErrors?.description}
        hint="e.g. practice exercises, a worked example, slides, a reading list."
      >
        {(aria) => <Textarea {...aria} name="description" rows={4} maxLength={1000} required defaultValue={v.description} />}
      </Field>
      <SubmitButton pendingText="Sending…">Send request</SubmitButton>
    </form>
  );
}
