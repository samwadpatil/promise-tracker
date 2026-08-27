import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const openai = process.env.OPENAI_API_KEY ?? "";
  let supaTest: any = null;
  try {
    const supa = getSupabaseAdmin();
    if (!supa) supaTest = { ok: false, error: "getSupabaseAdmin null" };
    else {
      const { data, error } = await supa.from("promises").select("id").limit(1);
      supaTest = { ok: !error, error: error?.message ?? null, code: (error as any)?.code ?? null, hint: (error as any)?.hint ?? null, hasData: !!data?.length };
    }
  } catch (e: any) {
    supaTest = { ok: false, error: e?.message };
  }
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_set: !!anon,
    anon_len: anon.length,
    SUPABASE_SERVICE_ROLE_KEY_set: !!service,
    service_len: service.length,
    OPENAI_API_KEY_set: !!openai,
    DEMO_MODE: process.env.DEMO_MODE,
    supaTest,
  });
}
