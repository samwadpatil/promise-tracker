import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEMO_PROMISES } from "@/lib/demoData";

export const dynamic = "force-dynamic";

// GET /api/promises?userId=demo@...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "demo@promise-tracker.dev";
  const status = searchParams.get("status");
  const supa = getSupabaseAdmin();
  if (!supa) {
    // Demo fallback without DB
    let data: any[] = DEMO_PROMISES.map((p, i) => ({
      id: `demo-${i}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...p,
    }));
    if (status) data = data.filter((d) => d.status === status);
    return NextResponse.json({ promises: data, demo: true });
  }
  try {
    // Latest 20 by creation - dashboard shows latest promises, not all history clutter
    let q = supa.from("promises").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    if (status && status !== "all") q = supa.from("promises").select("*").eq("user_id", userId).eq("status", status).order("created_at", { ascending: false }).limit(20);
    else if (status === "all") q = supa.from("promises").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      // Real-app mode: return empty, don't auto-seed. Demo seed only if DEMO_MODE=true
      if (process.env.DEMO_MODE === "true") {
        const seeded = DEMO_PROMISES.map((p) => ({ ...p, user_id: userId }));
        await supa.from("users").upsert({ id: userId, email: userId }, { onConflict: "id" });
        const { data: inserted, error: insErr } = await supa.from("promises").insert(seeded).select();
        if (insErr) throw new Error(insErr.message);
        return NextResponse.json({ promises: inserted ?? [], demo: false, seeded: true });
      }
      return NextResponse.json({ promises: [], demo: false });
    }
    return NextResponse.json({ promises: data });
  } catch (e: any) {
    console.error("Supabase promises error, falling back to demo:", e?.message);
    // Fallback to demo so dashboard never 500s — fix Supabase env/table then it will persist
    let data: any[] = DEMO_PROMISES.map((p, i) => ({
      id: `demo-${i}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...p,
    }));
    if (status) data = data.filter((d) => d.status === status);
    return NextResponse.json({ promises: data, demo: true, warning: `Supabase error: ${e?.message?.slice(0,120)}` });
  }
}

// PATCH /api/promises  {id, status, due_date, snoozed_until}
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, due_date, snoozed_until } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supa = getSupabaseAdmin();
  if (!supa) {
    return NextResponse.json({ ok: true, demo: true, message: "Demo mode - no DB configured, changes not persisted beyond session" });
  }
  const update: any = {};
  if (status) update.status = status;
  if (due_date !== undefined) update.due_date = due_date || null;
  if (snoozed_until !== undefined) update.snoozed_until = snoozed_until || null;
  const { data, error } = await supa.from("promises").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ promise: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ ok: true, demo: true });
  const { error } = await supa.from("promises").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
