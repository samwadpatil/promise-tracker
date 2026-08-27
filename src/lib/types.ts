export type PromiseStatus = "open" | "done" | "snoozed";
export type PromiseSource = "gmail" | "slack" | "demo";

export interface PromiseRow {
  id: string;
  user_id: string;
  source: PromiseSource;
  source_id: string;
  recipient: string | null;
  promise_text: string;
  context_snippet: string | null;
  due_date: string | null; // YYYY-MM-DD
  confidence: number | null;
  status: PromiseStatus;
  snoozed_until: string | null;
  created_at: string;
  gmail_rfc_id?: string | null;
}

export interface ExtractedPromise {
  promise: string;
  recipient: string | null;
  due: string | null; // YYYY-MM-DD
  confidence: number;
  context: string;
}
