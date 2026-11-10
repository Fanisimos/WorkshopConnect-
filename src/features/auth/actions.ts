"use server";

import { redirect } from "next/navigation";

import { homePathFor, safeNextPath } from "@/lib/auth";
import { fieldErrorsFrom, formValues, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

import { signInSchema, signUpSchema } from "./schema";

/** Turn Supabase Auth errors into safe, helpful messages (no internal detail). */
function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "email_not_confirmed":
      return "Please confirm your email address before logging in.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formValues(formData);
  const values = { email: raw.email ?? "" }; // never echo the password back
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { message: authErrorMessage(error?.code), values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(safeNextPath(raw.next) ?? homePathFor(profile?.role ?? "student"));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formValues(formData);
  const values = { fullName: raw.fullName ?? "", email: raw.email ?? "" };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // full_name is copied into profiles by a database trigger.
    // A "role" here would be ignored: every new account is a student.
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    return { message: authErrorMessage(error.code), values };
  }

  if (!data.session) {
    // Email confirmation is enabled on this Supabase project.
    return {
      ok: true,
      message: "Account created. Check your email to confirm your address, then log in.",
    };
  }

  redirect(safeNextPath(raw.next) ?? "/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
