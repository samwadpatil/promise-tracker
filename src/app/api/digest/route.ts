import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/digest?userId=...&to=...
// Protected by CRON_SECRET when called by Vercel Cron
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const to = searchParams.get("to");
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  const isCron = cronSecret === process.env.CRON_SECRET && !!process.env.CRON_SECRET;

  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // If cron, send to all users with open overdue/today
  if (isCron && !userId) {
    const { data: promises } = await supa.from("promises").select("*").eq("status", "open");
    const byUser = new Map<string, any[]>();
    for (const p of promises ?? []) {
      if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
      byUser.get(p.user_id)!.push(p);
    }
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    let sent = 0;
    for (const [uid, plist] of byUser) {
      if (resend) {
        await sendDigestEmail(resend, uid, plist);
        sent++;
      }
    }
    return NextResponse.json({ sent });
  }

  if (!userId || !to) return NextResponse.json({ error: "userId and to required" }, { status: 400 });
  const { data: promises } = await supa.from("promises").select("*").eq("user_id", userId).eq("status", "open").order("due_date", { ascending: true });
  if (!promises?.length) return NextResponse.json({ message: "No open promises" });

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  const resend = new Resend(process.env.RESEND_API_KEY);
  await sendDigestEmail(resend, to, promises);
  await supa.from("digests").insert({ user_id: userId, promise_count: promises.length });
  return NextResponse.json({ sent: true, count: promises.length });
}

async function sendDigestEmail(resend: Resend, to: string, promises: any[]) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = promises
    .map((p) => {
      const due = p.due_date ?? "No date";
      const overdue = p.due_date && p.due_date < today ? "🔴 OVERDUE" : p.due_date === today ? "🟡 Due today" : "";
      return `<tr><td style="padding:8px;border:1px solid #eee">${p.promise_text}</td><td style="padding:8px;border:1px solid #eee">${p.recipient ?? "—"}</td><td style="padding:8px;border:1px solid #eee">${due}</td><td style="padding:8px;border:1px solid #eee">${overdue}</td></tr>`;
    })
    .join("");

  const from = process.env.RESEND_FROM ?? "Promise Tracker <onboarding@resend.dev>";
  await resend.emails.send({
    from,
    to,
    subject: `Promise Tracker: ${promises.length} open promise${promises.length > 1 ? "s" : ""} — ${today}`,
    html: `
      <h2>Good morning — ${promises.length} open promise${promises.length > 1 ? "s" : ""}</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
        <thead><tr><th style="text-align:left;padding:8px;border:1px solid #eee;background:#fafafa">Promise</th><th style="padding:8px;border:1px solid #eee;background:#fafafa">To</th><th style="padding:8px;border:1px solid #eee;background:#fafafa">Due</th><th style="padding:8px;border:1px solid #eee;background:#fafafa"></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;color:#888">You're receiving this because you connected Promise Tracker. <a href="https://promise-tracker.vercel.app/dashboard">Open dashboard</a></p>
    `,
  });
}
