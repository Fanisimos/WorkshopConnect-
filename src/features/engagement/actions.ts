"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertRole } from "@/lib/auth";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { topicKey } from "@/lib/topics";

import { feedbackSchema, fulfilSchema, pulseSchema, requestSchema, resourceSchema } from "./schema";

// Pattern for every action: role check → Zod validation → write as the
// logged-in user (RLS + constraints are the final authority) → map database
// errors to friendly messages. student_id is never sent: the database
// fills it from the session.

const GENERIC = "Something went wrong. Please try again.";

function friendly(code: string | undefined, messages: Partial<Record<"duplicate" | "forbidden", string>>): string {
  if (code === "23505" && messages.duplicate) return messages.duplicate;
  if (code === "42501" && messages.forbidden) return messages.forbidden;
  return GENERIC;
}

function refresh(workshopId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/organiser", "layout");
  if (workshopId) revalidatePath(`/workshops/${workshopId}`, "layout");
}

// =========================================================== student

export async function submitFeedback(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("student");
  const values = formValues(formData);
  const parsed = feedbackSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { workshopId, rating, comment } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({ workshop_id: workshopId, rating, comment });
  if (error) {
    return {
      message: friendly(error.code, {
        duplicate: "You've already given feedback for this workshop.",
        forbidden: "You can only give feedback on workshops you checked in to.",
      }),
      values,
    };
  }
  refresh(workshopId);
  return { ok: true };
}

export async function submitPulse(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("student");
  const values = formValues(formData);
  const parsed = pulseSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { workshopId, confidenceBefore, confidenceAfter, topic } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("learning_pulse_responses").insert({
    workshop_id: workshopId,
    confidence_before: confidenceBefore,
    confidence_after: confidenceAfter,
    support_topic: topic,
  });
  if (error) {
    return {
      message: friendly(error.code, {
        duplicate: "You've already completed the Learning Pulse for this workshop.",
        forbidden: "You can only complete the Learning Pulse for workshops you checked in to.",
      }),
      values,
    };
  }
  refresh(workshopId);
  return { ok: true };
}

export async function createRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("student");
  const values = formValues(formData);
  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { workshopId, topic, description } = parsed.data;
  const supabase = await createClient();
  // status is not sent (and can't be): every request starts as "pending".
  const { error } = await supabase.from("resource_requests").insert({ workshop_id: workshopId, topic, description });
  if (error) {
    return { message: friendly(error.code, { forbidden: "You can't request resources for this workshop." }), values };
  }
  refresh(workshopId);
  redirect("/requests?sent=1");
}

// ========================================================= organiser

export async function addResource(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("organiser");
  const values = formValues(formData);
  const parsed = resourceSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { workshopId, title, url, topic, fulfilMatching } = parsed.data;
  const supabase = await createClient();
  const { data: resource, error } = await supabase
    .from("resources")
    .insert({ workshop_id: workshopId, title, url, topic })
    .select("id")
    .single();
  if (error || !resource) {
    return { message: friendly(error?.code, { forbidden: "You can only add resources to your own workshops." }), values };
  }

  // Closing the loop: optionally fulfil every open request on the same topic.
  let fulfilled = 0;
  if (fulfilMatching && topic) {
    const { data: open } = await supabase
      .from("resource_requests")
      .select("id, topic")
      .eq("workshop_id", workshopId)
      .neq("status", "fulfilled");
    const ids = (open ?? []).filter((r) => r.topic && topicKey(r.topic) === topicKey(topic)).map((r) => r.id);
    if (ids.length) {
      const { data: updated } = await supabase
        .from("resource_requests")
        .update({ status: "fulfilled", resource_id: resource.id })
        .in("id", ids)
        .select("id");
      fulfilled = updated?.length ?? 0;
    }
  }

  refresh(workshopId);
  return {
    ok: true,
    message:
      fulfilled > 0
        ? `Resource shared. ${fulfilled} matching ${fulfilled === 1 ? "request was" : "requests were"} marked as fulfilled.`
        : "Resource shared with students.",
  };
}

export async function deleteResource(resourceId: string, workshopId: string): Promise<void> {
  await assertRole("organiser");
  if (!isUuid(resourceId) || !isUuid(workshopId)) throw new Error("Resource not found");
  const supabase = await createClient();
  const { data, error } = await supabase.from("resources").delete().eq("id", resourceId).select("id");
  // 23503: the resource is linked to a fulfilled request and is kept so students don't lose it.
  if (error?.code === "23503") throw new Error("This resource was used to fulfil a request and can't be deleted");
  if (error || !data?.length) throw new Error("Could not delete resource");
  refresh(workshopId);
}

export async function markRequestInProgress(requestId: string): Promise<void> {
  await assertRole("organiser");
  if (!isUuid(requestId)) throw new Error("Request not found");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_requests")
    .update({ status: "in_progress" })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("workshop_id");
  if (error || !data?.length) throw new Error("Could not update request");
  refresh(data[0].workshop_id);
}

export async function fulfilRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("organiser");
  const values = formValues(formData);
  const parsed = fulfilSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { requestId, newTitle, newUrl, note } = parsed.data;
  let { resourceId } = parsed.data;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("resource_requests")
    .select("workshop_id, topic")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { message: "Request not found." };

  // A brand-new link is saved as a workshop resource first, so other students can use it too.
  if (newUrl && newTitle) {
    const { data: created, error } = await supabase
      .from("resources")
      .insert({ workshop_id: request.workshop_id, title: newTitle, url: newUrl, topic: request.topic })
      .select("id")
      .single();
    if (error || !created) return { message: GENERIC, values };
    resourceId = created.id;
  }

  const { data, error } = await supabase
    .from("resource_requests")
    .update({ status: "fulfilled", resource_id: resourceId ?? null, organiser_note: note ?? null })
    .eq("id", requestId)
    .select("id");
  if (error || !data?.length) return { message: GENERIC, values };

  refresh(request.workshop_id);
  return { ok: true, message: "Request fulfilled. The student can now see your response." };
}
