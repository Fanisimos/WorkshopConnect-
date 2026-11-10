import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/features/auth/register-form";
import { getCurrentUser, homePathFor, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const next = safeNextPath(params.next) ?? undefined;

  const user = await getCurrentUser();
  if (user) redirect(next ?? homePathFor(user.role));

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Create your student account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Check in to workshops, share feedback and request extra support.
      </p>
      <RegisterForm next={next} />
    </>
  );
}
