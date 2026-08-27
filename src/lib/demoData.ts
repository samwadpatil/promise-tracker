import { PromiseRow } from "./types";

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DEMO_PROMISES: Omit<PromiseRow, "id" | "user_id" | "created_at">[] = [
  {
    source: "gmail",
    source_id: "gmail-1",
    recipient: "rahul@acme.co",
    promise_text: "send Q3 deck",
    context_snippet: "I'll send the Q3 deck by Friday EOD — adding the pipeline slide.",
    due_date: daysFromNow(1),
    confidence: 0.92,
    status: "open",
    snoozed_until: null,
  },
  {
    source: "slack",
    source_id: "slack-1",
    recipient: "#proj-atlas",
    promise_text: "review PR #42",
    context_snippet: "I'll review PR #42 by tomorrow morning and leave comments.",
    due_date: daysFromNow(0),
    confidence: 0.88,
    status: "open",
    snoozed_until: null,
  },
  {
    source: "gmail",
    source_id: "gmail-2",
    recipient: "priya@partner.io",
    promise_text: "share pricing sheet",
    context_snippet: "Let me share the updated pricing sheet by EOD today.",
    due_date: daysFromNow(0),
    confidence: 0.9,
    status: "open",
    snoozed_until: null,
  },
  {
    source: "gmail",
    source_id: "gmail-3",
    recipient: "hiring@startup.xyz",
    promise_text: "send references",
    context_snippet: "I'll send over references by Monday.",
    due_date: daysFromNow(-2),
    confidence: 0.85,
    status: "open",
    snoozed_until: null,
  },
  {
    source: "slack",
    source_id: "slack-2",
    recipient: "sarah (DM)",
    promise_text: "update onboarding checklist",
    context_snippet: "I'll update the onboarding checklist tomorrow.",
    due_date: daysFromNow(2),
    confidence: 0.76,
    status: "snoozed",
    snoozed_until: daysFromNow(3),
  },
  {
    source: "demo",
    source_id: "demo-1",
    recipient: "team@promise-tracker.dev",
    promise_text: "ship landing page copy",
    context_snippet: "Demo: I'll ship landing page copy by next week.",
    due_date: daysFromNow(5),
    confidence: 0.64,
    status: "open",
    snoozed_until: null,
  },
];
