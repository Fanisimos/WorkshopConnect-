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
  /** Optional name/value, sent with the form when this button is the one clicked. */
  name?: string;
  value?: string;
};

/** Submit button that disables itself and shows progress while its form is submitting. */
export function SubmitButton({ children, pendingText, variant, size, className, name, value }: Props) {
  const { pending, data } = useFormStatus();
  // With several submit buttons, only show progress text on the one that was clicked.
  const isThisButton = !name || data?.get(name) === value;
  const showPending = pending && isThisButton;

  return (
    <Button
      type="submit"
      name={name}
      value={value}
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      aria-disabled={pending}
    >
      {showPending && <Spinner />}
      {showPending ? (pendingText ?? children) : children}
    </Button>
  );
}
