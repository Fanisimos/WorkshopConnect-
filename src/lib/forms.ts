import { z } from "zod";

/**
 * Shape returned by every form Server Action and consumed by useActionState.
 *  - fieldErrors: messages shown under specific fields
 *  - message:     form-level error or success text
 *  - values:      non-sensitive inputs echoed back so the form keeps them
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Read FormData into a plain object of strings (files are ignored). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export function fieldErrorsFrom(error: z.ZodError): FormState["fieldErrors"] {
  return z.flattenError(error).fieldErrors as FormState["fieldErrors"];
}
