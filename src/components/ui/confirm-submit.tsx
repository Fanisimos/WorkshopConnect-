"use client";

import type { ReactNode } from "react";

import { SubmitButton } from "@/components/ui/submit-button";

/** A submit button that asks for confirmation first (for destructive actions). */
export function ConfirmSubmit({
  children,
  confirmMessage,
  pendingText,
  variant = "danger",
  size = "md",
  className = "w-full",
}: {
  children: ReactNode;
  confirmMessage: string;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className="contents"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button[type=submit]") && !window.confirm(confirmMessage)) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <SubmitButton variant={variant} size={size} pendingText={pendingText} className={className}>
        {children}
      </SubmitButton>
    </span>
  );
}
