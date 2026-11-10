import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser, homePathFor, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next) ?? undefined;

  const user = await getCurrentUser();
  if (user) redirect(next ?? homePathFor(user.role));

  const isCheckIn = next?.startsWith("/check-in/");

  return (
    <>
      <h1 className="text-xl font-semibold text-ink">Log in</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Welcome back. Students and organisers use the same login.</p>
      {isCheckIn && (
        <Alert tone="info" className="mb-5">
          Log in to finish checking in to your workshop.
        </Alert>
      )}
      <LoginForm next={next} />
    </>
  );
}
