/**
 * Topics are short free text ("SQL JOINs"). To group them, compare a
 * normalised key: lower-case, single spaces, trimmed. "SQL  joins " and
 * "sql JOINs" count as the same topic.
 */
export function topicKey(topic: string): string {
  return topic.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Tidy whitespace for storage/display; empty → null. */
export function cleanTopic(topic: string | null | undefined): string | null {
  const t = (topic ?? "").replace(/\s+/g, " ").trim();
  return t.length ? t : null;
}

/**
 * The topic a student picked: the "Other" text box wins over a selected chip,
 * so typing something always counts.
 */
export function chosenTopic(selected: string | undefined, other: string | undefined): string | null {
  return cleanTopic(other) ?? cleanTopic(selected === "__other" ? "" : selected);
}
