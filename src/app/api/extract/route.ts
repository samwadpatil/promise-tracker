import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractPromises } from "@/lib/ai";
import { fetchGmailSent } from "@/lib/gmail";
import { fetchSlackSent } from "@/lib/slack";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const demoMode = process.env.DEMO_MODE === "true";
  const session: any = await getServerSession(authOptions as any);
  const body = await req.json().catch(() => ({}));
  const userId: string = session?.user?.email ?? body.fakeUserId ?? "demo@promise-tracker.dev";

  const today = new Date().toISOString().slice(0, 10);
  const messages: { body: string; recipient: string | null; today: string; source: string; sourceId: string; rfcId: string | null }[] = [];

  const gmailToken = session?.gmailAccessToken ?? body.gmailAccessToken;
  if (gmailToken) {
    try {
      const gmail = await fetchGmailSent(gmailToken, 50);
      for (const g of gmail) {
        messages.push({ body: g.body, recipient: g.to, today, source: "gmail", sourceId: g.id, rfcId: g.rfcId });
      }
    } catch (e) {
      console.error(e);
    }
  }

  const slackToken = session?.slackAccessToken ?? body.slackAccessToken;
  if (slackToken) {
    try {
      const slack = await fetchSlackSent(slackToken, 7);
      for (const s of slack) {
        messages.push({ body: s.text, recipient: s.channel, today, source: "slack", sourceId: s.id, rfcId: null });
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (messages.length === 0 && body.pastedText) {
    messages.push({ body: body.pastedText, recipient: body.recipient ?? null, today, source: "demo", sourceId: `pasted-${Date.now()}`, rfcId: null });
  }

  if (messages.length === 0 && demoMode) {
    return NextResponse.json({ demo: true, count: 0, message: "No messages found. Using demo data.", today });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages found. Connect Gmail/Slack or paste text." }, { status: 400 });
  }

  const debugBodies = messages.slice(0, 3).map((m) => ({ source: m.source, recipient: m.recipient, bodyPreview: m.body.slice(0, 250), bodyLen: m.body.length, rfcId: m.rfcId?.slice(0, 30) }));
  const extractedRaw = await extractPromises(messages.map((m) => ({ body: m.body, recipient: m.recipient, today: m.today })));

  // Deduplicate extracted promises by normalized text (fixes same mail showing twice)
  const seen = new Set<string>();
  const extracted: typeof extractedRaw = [];
  for (const p of extractedRaw) {
    const key = p.promise.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    extracted.push(p);
  }

  const supa = getSupabaseAdmin();
  let inserted: any[] = [];
  if (supa && extracted.length > 0) {
    await supa.from("users").upsert({ id: userId, email: userId }, { onConflict: "id" });
    // Delete old promises for these Gmail ids (hashed source_id like id-hash-idx)
    const sourceIds = [...new Set(messages.map((m) => m.sourceId))];
    for (const mid of sourceIds.slice(0, 50)) {
      await supa.from("promises").delete().eq("user_id", userId).like("source_id", `${mid}%`);
    }
    const rows = extracted.map((e, idx) => {
      const base = messages.find((m) => m.body.toLowerCase().includes(e.promise.slice(0, 12).toLowerCase())) ?? messages[idx % messages.length];
      const promiseHash = e.promise.slice(0, 20).replace(/\W/g, "").toLowerCase();
      return {
        user_id: userId,
        source: base?.source ?? "demo",
        source_id: `${base?.sourceId ?? `gen-${idx}`}-${promiseHash}-${idx}`,
        gmail_rfc_id: (base as any)?.rfcId ?? null,
        recipient: e.recipient ?? base?.recipient ?? null,
        promise_text: e.promise,
        context_snippet: e.context,
        due_date: e.due,
        confidence: e.confidence,
        status: "open",
      };
    });
    const { data, error } = await supa.from("promises").insert(rows).select();
    if (error) {
      // fallback if gmail_rfc_id column not yet added
      if (error.message.includes("gmail_rfc_id")) {
        const fallbackRows = rows.map(({ gmail_rfc_id, ...r }) => r);
        const { data: d2, error: e2 } = await supa.from("promises").insert(fallbackRows).select();
        if (e2) console.error("Insert fallback error", e2);
        inserted = d2 ?? [];
      } else console.error("Insert error", error);
    } else inserted = data ?? [];
  }

  return NextResponse.json({ count: extracted.length, promises: extracted, inserted, today, debugBodies: extracted.length === 0 ? debugBodies : undefined, scanned: messages.length });
}
