import { z } from "zod";

import type { Enums } from "@/lib/database.types";
import { ukLocalToUtcIso } from "@/lib/dates";

export type WorkshopStatus = Enums<"workshop_status">;

export const MAX_FOCUS_TOPICS = 8;
export const MAX_TOPIC_LENGTH = 40;

/**
 * "SQL JOINs, group by,  Subqueries , sql joins" → ["SQL JOINs", "group by", "Subqueries"]
 * Split on commas or new lines, tidy whitespace, drop blanks and case-insensitive duplicates.
 */
export function parseFocusTopics(input: string): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const raw of input.split(/[,\n]/)) {
    const topic = raw.replace(/\s+/g, " ").trim();
    const key = topic.toLowerCase();
    if (topic && !seen.has(key)) {
      seen.add(key);
      topics.push(topic);
    }
  }
  return topics;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/** Validates the create/edit form and converts it into database columns. */
export const workshopFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
    description: z.string().trim().max(2000, "Description must be 2000 characters or fewer.").default(""),
    date: z.string().regex(DATE, "Choose a date."),
    startTime: z.string().regex(TIME, "Choose a start time."),
    endTime: z.string().regex(TIME, "Choose an end time."),
    location: z.string().trim().min(2, "Enter a location.").max(120, "Location must be 120 characters or fewer."),
    focusTopics: z
      .string()
      .default("")
      .transform(parseFocusTopics)
      .pipe(
        z
          .array(z.string().max(MAX_TOPIC_LENGTH, `Each topic must be ${MAX_TOPIC_LENGTH} characters or fewer.`))
          .max(MAX_FOCUS_TOPICS, `Add up to ${MAX_FOCUS_TOPICS} topics.`),
      ),
    // Only used when creating: the two submit buttons send "draft" or "published".
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .transform((form, ctx) => {
    const startsAt = ukLocalToUtcIso(form.date, form.startTime);
    const endsAt = ukLocalToUtcIso(form.date, form.endTime);
    if (!startsAt || !endsAt) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "Enter a valid date and times." });
      return z.NEVER;
    }
    if (endsAt <= startsAt) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after the start time." });
      return z.NEVER;
    }
    return {
      title: form.title,
      description: form.description,
      location: form.location,
      focus_topics: form.focusTopics,
      starts_at: startsAt,
      ends_at: endsAt,
      status: form.status,
    };
  });

export type WorkshopFormOutput = z.output<typeof workshopFormSchema>;

/**
 * Allowed status changes. Published workshops cannot go back to draft,
 * because students may already have checked in.
 */
const TRANSITIONS: Record<WorkshopStatus, WorkshopStatus[]> = {
  draft: ["published"],
  published: ["completed", "cancelled"],
  completed: ["published"],
  cancelled: ["published"],
};

export function allowedTransitions(from: WorkshopStatus): WorkshopStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: WorkshopStatus, to: WorkshopStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const workshopStatusSchema = z.enum(["draft", "published", "completed", "cancelled"]);
