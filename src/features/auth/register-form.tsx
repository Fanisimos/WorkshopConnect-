"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms";

import { signUp } from "./actions";

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signUp, initialFormState);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  if (state.ok) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Almost there">
          {state.message}
        </Alert>
        <Link href={loginHref} className="block text-center text-sm font-medium text-brand-700 hover:underline">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <Field id="fullName" label="Full name" errors={state.fieldErrors?.fullName}>
        {(aria) => (
          <Input {...aria} name="fullName" autoComplete="name" required maxLength={100} defaultValue={state.values?.fullName} />
        )}
      </Field>

      <Field id="email" label="Email" errors={state.fieldErrors?.email}>
        {(aria) => (
          <Input {...aria} name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
        )}
      </Field>

      <Field id="password" label="Password" hint="At least 8 characters." errors={state.fieldErrors?.password}>
        {(aria) => (
          <Input {...aria} name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        )}
      </Field>

      <SubmitButton className="w-full" size="lg" pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-xs text-ink-muted">
        We only store your name and email. Your workshop activity is visible to you and to the organisers
        of workshops you take part in.
      </p>

      <p className="text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link href={loginHref} className="font-medium text-brand-700 hover:underline">
          Log in
        </Link>
      </p>

      <p className="border-t border-line pt-4 text-center text-xs text-ink-muted">
        University staff: register here, then ask your administrator to enable organiser access.
      </p>
    </form>
  );
}
