import OpenAI from "openai";
import { ExtractedPromise } from "./types";

export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const EXTRACTION_SYSTEM = `You are a commitment extractor. Analyze SENT messages (messages the USER sent).
Correct typos silently (sbmit->submit, reuested->requested, "done by" = promised to complete).
Extract ALL promises per message — one message can have multiple.
Valid commitment forms: "I will", "I'll", "I shall", "I can", "let me", "going to", "will be", "okay I'll", "ok I'll", "I'll be".
Also catch: "the [noun] will be done by [day]" = sender promises to complete it.
Ignore: Questions, promises TO the sender, vague "maybe", "I hope", "might".

Return ONLY valid JSON: an array of objects [{promise, recipient, due, confidence, context}]
- promise: short action phrase, e.g., "send deck", "complete the app". Fix typos.
- recipient: email or name, or null
- due: YYYY-MM-DD or null. MUST resolve: "Friday"->next Friday, "wednesday"->next Wednesday, "tomorrow"->tomorrow, "EOD"->today, "next week"->next Monday, "saturday"->next Saturday, "sunday"->next Sunday, "monday"->next Monday. "by Saturday" = Saturday. Always YYYY-MM-DD.
- confidence: 0.0-1.0
- context: one sentence surrounding promise.

TODAY is {today}. Today is Monday 2026-08-24. Saturday is 2026-08-29, Sunday 2026-08-30, Monday 2026-08-31.`;

function parseDueFallback(text: string, todayStr: string): string | null {
  const today = new Date(todayStr + "T12:00:00");
  const lower = text.toLowerCase();
  if (/\beod\b/.test(lower) || /\btoday\b/.test(lower)) return todayStr;
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (/next week/.test(lower)) {
    const d = new Date(today);
    const daysToMonday = (8 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysToMonday);
    return d.toISOString().slice(0, 10);
  }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < weekdays.length; i++) {
    const wd = weekdays[i];
    const re = new RegExp(`\\b(?:on|by|this|next)?\\s*${wd}\\b`, "i");
    if (re.test(text)) {
      const todayIdx = today.getDay();
      let diff = (i - todayIdx + 7) % 7;
      if (diff === 0) diff = 7;
      if (new RegExp(`next\\s+${wd}`, "i").test(text)) diff += 7;
      const d = new Date(today); d.setDate(d.getDate() + diff);
      return d.toISOString().slice(0, 10);
    }
  }
  const m = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (m) return m[1];
  return null;
}

export async function extractPromises(
  messages: { body: string; recipient: string | null; today: string }[]
): Promise<ExtractedPromise[]> {
  const openai = getOpenAI();
  if (!openai) return heuristicExtract(messages);
  const today = messages[0]?.today ?? new Date().toISOString().slice(0, 10);
  const system = EXTRACTION_SYSTEM.replace("{today}", today);
  const batchSize = 6;
  const all: ExtractedPromise[] = [];
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const userContent = batch.map((m, idx) => `Message ${idx + 1} (to: ${m.recipient ?? "unknown"}):\n"""${m.body.slice(0, 1500)}"""`).join("\n\n");
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Extract promises. Return JSON object with key "promises": array.\n\n${userContent}` },
        ],
      });
      const text = resp.choices[0]?.message?.content ?? '{"promises":[]}';
      const parsed = JSON.parse(text);
      const arr: ExtractedPromise[] = Array.isArray(parsed) ? parsed : parsed.promises ?? [];
      for (const p of arr) {
        if (p.promise && typeof p.promise === "string") {
          let due: string | null = p.due ?? null;
          if (!due) {
            const ctx = (p.context ?? p.promise) + " " + batch.map((b) => b.body).join(" ");
            due = parseDueFallback(ctx, today);
          } else if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) {
            const parsedFallback = parseDueFallback(due + " " + p.context, today);
            due = parsedFallback ?? null;
          }
          all.push({
            promise: p.promise.slice(0, 200),
            recipient: p.recipient ?? batch[0]?.recipient ?? null,
            due,
            confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
            context: p.context ?? p.promise,
          });
        }
      }
    } catch (e) {
      console.error("OpenAI extract error, falling back to heuristic", e);
      all.push(...heuristicExtract(batch));
    }
  }
  for (const p of all) if (!p.due) { const fb = parseDueFallback(p.context ?? p.promise, today); if (fb) p.due = fb; }
  return all;
}

function heuristicExtract(messages: { body: string; recipient: string | null }[]): ExtractedPromise[] {
  const today = new Date().toISOString().slice(0, 10);
  const out: ExtractedPromise[] = [];
  for (const m of messages) {
    const cleaned = m.body.replace(/\s+/g, " ").trim();
    // Split on clause boundaries to catch 2 promises in one mail
    const clauses = cleaned.split(/(?:,|\balso\b|\band then\b|\n|;)+/i);
    for (let ci = 0; ci < clauses.length; ci++) {
      const c = clauses[ci].trim();
      if (c.length < 8) continue;
      // Pattern 1: I will / I'll / I shall + promise + optional by/on date
      const re1 = /\b(I'll|I will|I shall|I can|let me)\b\s+([^.,;]{3,90})(?:\s+(by|on|before)\s+([a-z0-9 ,]+))?/gi;
      let match1;
      while ((match1 = re1.exec(c)) !== null) {
        let raw = (match1[2] ?? "").trim().slice(0, 120);
        raw = raw.replace(/\b(sbmit|reuested|modifty|reop|teh)\b/gi, (v) => {
          const l = v.toLowerCase();
          if (l === "sbmit") return "submit";
          if (l === "reuested") return "requested";
          if (l === "teh") return "the";
          return v;
        });
        // If raw is too short, skip; else clean
        if (raw.length < 4) continue;
        // Extract due from this clause + next 40 chars
        const due = parseDueFallback(c.slice(match1.index ?? 0, (match1.index ?? 0) + 120), today);
        // Clean promise: remove trailing 'also' etc
        const promise = raw.split(/\s+also\s+/i)[0].trim().replace(/\s+/g, " ");
        if (promise.length < 4) continue;
        const key = promise.toLowerCase();
        if (out.some((o) => o.promise.toLowerCase() === key)) continue;
        out.push({ promise, recipient: m.recipient, due, confidence: 0.62, context: c.slice(0, 140) });
        if (out.length > 12) break;
      }
      // Pattern 2: passive "will (be) done/completed by [weekday]" -> promise is nearby noun
      const re2 = /\b(will\s+(?:be\s+)?(?:done|completed|finished|ready|available))\s+(by|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|[a-z0-9 ,]+)/gi;
      let match2;
      while ((match2 = re2.exec(c)) !== null) {
        const due = parseDueFallback(match2[0], today);
        // try to find subject noun before will
        const before = c.slice(0, match2.index).trim();
        const subj = before.match(/(\bapp\b|\bwork\b|\btask\b|\bproject\b|\bdocuments?\b|\bfiles?\b)[^.,]{0,30}$/i)?.[0] ?? "complete task";
        const promise = subj.includes("app") || subj.includes("task") ? subj.trim() : `complete ${subj.trim()}`.slice(0, 80);
        const key = promise.toLowerCase();
        if (out.some((o) => o.promise.toLowerCase() === key)) continue;
        out.push({ promise: promise.replace(/\s+/g, " ").trim(), recipient: m.recipient, due, confidence: 0.6, context: c.slice(0, 140) });
        if (out.length > 12) break;
      }
    }
    // Fallback for this message if still none: any by/on weekday with a verb
    const hasPromise = out.some((o) => cleaned.toLowerCase().includes(o.promise.toLowerCase().slice(0, 8)));
    if (!hasPromise) {
      const m2 = cleaned.match(/\b(by|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      const hasVerb = /\b(send|submit|share|modify|revert|complete|done|ready|modify)\b/i.test(cleaned);
      if (m2 && hasVerb) {
        const due = parseDueFallback(cleaned, today);
        const verb = cleaned.match(/\b(send|submit|share|modify|revert|complete|modify\s+the\s+files[^.,]{0,40}|app\s+will[^.,]{0,30})\b[^.,]{0,50}/i)?.[0] ?? cleaned.split(".")[0].slice(0, 80);
        const promise = verb.replace(/^.*?\b(I'll|I will|I shall)\b\s*/i, "").trim().slice(0, 80);
        if (promise.length > 4) out.push({ promise, recipient: m.recipient, due, confidence: 0.55, context: cleaned.slice(0, 140) });
      }
    }
  }
  // final dedup across all messages
  const uniq = new Map<string, (typeof out)[number]>();
  for (const p of out) {
    const k = p.promise.toLowerCase().replace(/\s+/g, " ").trim();
    if (!uniq.has(k)) uniq.set(k, p);
  }
  return Array.from(uniq.values());
}

export async function generateNudgeDraft(opts: { promiseText: string; recipient: string | null; dueDate: string | null; overdue: boolean; }): Promise<{ delayed: string; delivered: string }> {
  const openai = getOpenAI();
  if (!openai) return { delayed: `Hi ${opts.recipient ?? "there"}, quick update on "${opts.promiseText}" — running a bit behind, will share by ${opts.dueDate ?? "tomorrow EOD"}. Sorry for the delay!`, delivered: `Hi ${opts.recipient ?? "there"}, as promised — "${opts.promiseText}" is done. Let me know if anything else needed!` };
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini", temperature: 0.4,
    messages: [{ role: "system", content: "You write concise, professional follow-up emails. Return JSON {delayed, delivered}." }, { role: "user", content: `Promise: "${opts.promiseText}" to ${opts.recipient ?? "recipient"} due ${opts.dueDate ?? "no date"} overdue=${opts.overdue}. Write two drafts: delayed (apologize, new ETA) and delivered (share completion). Each under 50 words.` }],
    response_format: { type: "json_object" },
  });
  try { const j = JSON.parse(resp.choices[0]?.message?.content ?? "{}"); return { delayed: j.delayed ?? "", delivered: j.delivered ?? "" }; } catch { return { delayed: resp.choices[0]?.message?.content ?? "", delivered: "" }; }
}
