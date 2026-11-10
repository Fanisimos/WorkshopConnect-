"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertRole } from "@/lib/auth";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

import { canTransition, workshopFormSchema, workshopStatusSchema, type WorkshopStatus } from "./schema";

// Every action: (1) checks the caller is an organiser, (2) validates input
// with Zod, (3) writes as the logged-in user so RLS enforces ownership.

const GENERIC_ERROR = "Something went wrong saving the workshop. Please try again.";

function refreshWorkshopPages(id?: string) {
  revalidatePath("/organiser", "layout");
  revalidatePath("/workshops", "layout");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/organiser/workshops/${id}`);
}

export async function createWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("organiser");
  const values = formValues(formData);
  const parsed = workshopFormSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  // organiser_id is not sent: the database fills it from the session (auth.uid()).
  const { data, error } = await supabase.from("workshops").insert(parsed.data).select("id").single();
  if (error || !data) {
    return { message: GENERIC_ERROR, values };
  }

  refreshWorkshopPages(data.id);
  redirect(`/organiser/workshops/${data.id}?created=1`);
}

export async function updateWorkshop(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await assertRole("organiser");
  if (!isUuid(id)) return { message: "Workshop not found." };

  const values = formValues(formData);
  const parsed = workshopFormSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  // Status is changed with the dedicated buttons, never by the edit form.
  const { status: _ignored, ...changes } = parsed.data;
  void _ignored;

  const supabase = await createClient();
  const { data, error } = await supabase.from("workshops").update(changes).eq("id", id).select("id");
  if (error) return { message: GENERIC_ERROR, values };
  if (!data?.length) return { message: "Workshop not found, or you don't have permission to edit it." };

  refreshWorkshopPages(id);
  redirect(`/organiser/workshops/${id}?saved=1`);
}

export async function setWorkshopStatus(id: string, nextStatus: WorkshopStatus): Promise<void> {
  await assertRole("organiser");
  const status = workshopStatusSchema.parse(nextStatus);
  if (!isUuid(id)) throw new Error("Workshop not found");

  const supabase = await createClient();
  const { data: current } = await supabase.from("workshops").select("status").eq("id", id).maybeSingle();
  if (!current) throw new Error("Workshop not found");
  if (!canTransition(current.status, status)) {
    throw new Error(`A ${current.status} workshop cannot be changed to ${status}`);
  }

  const { data, error } = await supabase.from("workshops").update({ status }).eq("id", id).select("id");
  if (error || !data?.length) throw new Error("Could not update workshop status");

  refreshWorkshopPages(id);
  redirect(`/organiser/workshops/${id}`);
}

export async function deleteDraftWorkshop(id: string): Promise<void> {
  await assertRole("organiser");
  if (!isUuid(id)) throw new Error("Workshop not found");

  const supabase = await createClient();
  // RLS only permits deleting your own drafts; the filter makes the intent explicit.
  const { data, error } = await supabase.from("workshops").delete().eq("id", id).eq("status", "draft").select("id");
  if (error || !data?.length) throw new Error("Only draft workshops can be deleted");

  refreshWorkshopPages();
  redirect("/organiser/workshops");
}
