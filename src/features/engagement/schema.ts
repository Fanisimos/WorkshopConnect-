import { z } from "zod";

import { chosenTopic } from "@/lib/topics";

const workshopId = z.uuid("Workshop not found.");
const score = (label: string) =>
  z.coerce
    .number({ error: `Choose ${label}.` })
    .int(`Choose ${label}.`)
    .min(1, `Choose ${label}.`)
    .max(5, `Choose ${label}.`);

/** Optional topic from the TopicPicker: a chip ("topic") or free text ("topicOther"). */
const topicFields = {
  topic: z.string().optional(),
  topicOther: z.string().max(80, "Topic must be 80 characters or fewer.").optional(),
};
const withTopic = <T extends { topic?: string; topicOther?: string }>({ topic, topicOther, ...rest }: T) => ({
  ...rest,
  topic: chosenTopic(topic, topicOther),
});

// --- Feedback -----------------------------------------------------------

export const feedbackSchema = z.object({
  workshopId,
  rating: score("a rating from 1 to 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment must be 1000 characters or fewer.")
    .optional()
    .transform((c) => (c ? c : null)),
});

// --- Learning Pulse -----------------------------------------------------

export const pulseSchema = z
  .object({
    workshopId,
    confidenceBefore: score("how confident you felt before"),
    confidenceAfter: score("how confident you feel now"),
    ...topicFields,
  })
  .transform(withTopic)
  .refine((v) => v.topic === null || v.topic.length <= 80, {
    path: ["topicOther"],
    message: "Topic must be 80 characters or fewer.",
  });

// --- Resource requests (student) ---------------------------------------

export const requestSchema = z
  .object({
    workshopId,
    ...topicFields,
    description: z
      .string()
      .trim()
      .min(10, "Tell us a little more (at least 10 characters).")
      .max(1000, "Please keep it under 1000 characters."),
  })
  .transform(withTopic)
  .refine((v) => v.topic === null || v.topic.length <= 80, {
    path: ["topicOther"],
    message: "Topic must be 80 characters or fewer.",
  });

// --- Resources (organiser) ---------------------------------------------

const httpsUrl = z
  .string()
  .trim()
  .max(2000, "Link is too long.")
  .pipe(z.url({ protocol: /^https$/, error: "Enter a full https:// link." }));

export const resourceSchema = z.object({
  workshopId,
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
  url: httpsUrl,
  topic: z
    .string()
    .max(80, "Topic must be 80 characters or fewer.")
    .optional()
    .transform((t) => chosenTopic(t, undefined)),
  // On the insights page: also fulfil the open requests about this topic.
  fulfilMatching: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

// --- Fulfilling a request (organiser) -----------------------------------

const optional = (schema: z.ZodString) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(schema.optional());

export const fulfilSchema = z
  .object({
    requestId: z.uuid("Request not found."),
    resourceId: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.uuid("Choose a resource.").optional()),
    newTitle: optional(z.string().min(3, "Title must be at least 3 characters.").max(120)),
    newUrl: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(httpsUrl.optional()),
    note: optional(z.string().max(500, "Note must be 500 characters or fewer.")),
  })
  .superRefine((v, ctx) => {
    if (v.newUrl && !v.newTitle) {
      ctx.addIssue({ code: "custom", path: ["newTitle"], message: "Give the new link a title." });
    }
    if (v.newTitle && !v.newUrl) {
      ctx.addIssue({ code: "custom", path: ["newUrl"], message: "Add the link for this resource." });
    }
    if (!v.resourceId && !v.newUrl && !v.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Share a resource or write a short note so the student gets a response.",
      });
    }
  });
