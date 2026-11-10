"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Submit button that disables itself and shows progress while its form is submitting. */
export function SubmitButton({ children, pendingText, variant, size, className }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} aria-disabled={pending}>
      {pending && <Spinner />}
      {pending ? (pendingText ?? children) : children}
    </Button>
  );
}
