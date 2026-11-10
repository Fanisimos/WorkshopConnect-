"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialFormState } from "@/lib/forms";

import { signIn } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signIn, initialFormState);
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <Field id="email" label="Email" errors={state.fieldErrors?.email}>
        {(aria) => (
          <Input {...aria} name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
        )}
      </Field>

      <Field id="password" label="Password" errors={state.fieldErrors?.password}>
        {(aria) => <Input {...aria} name="password" type="password" autoComplete="current-password" required />}
      </Field>

      <SubmitButton className="w-full" size="lg" pendingText="Logging in…">
        Log in
      </SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        New to Workshop Connect+?{" "}
        <Link href={registerHref} className="font-medium text-brand-700 hover:underline">
          Create a student account
        </Link>
      </p>
    </form>
  );
}
