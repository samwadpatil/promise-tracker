import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  const token = session?.gmailAccessToken;
  if (!token) return NextResponse.json({ error: "No gmailAccessToken in session", sessionExists: !!session, session });
  const q = encodeURIComponent("in:sent newer_than:7d");
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=5`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  const listText = await listRes.text();
  let listJson: any = null;
  try { listJson = JSON.parse(listText); } catch {}
  if (!listRes.ok) {
    return NextResponse.json({ ok: false, status: listRes.status, listText: listText.slice(0, 800), listJson });
  }
  const ids = (listJson.messages ?? []).slice(0, 3).map((m: any) => m.id);
  const details: any[] = [];
const b64UrlDecode = (d: string) => {
    const b64 = d.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    try { return Buffer.from(padded, "base64").toString("utf-8").slice(0, 1200); } catch { return "[decode failed]"; }
  };
  const collect = (payload: any, out: any[] = []): any[] => {
    if (!payload) return out;
    if (payload.mimeType && payload.body?.data) out.push({ mimeType: payload.mimeType, len: payload.body.data.length, preview: b64UrlDecode(payload.body.data).slice(0, 200) });
    if (payload.parts) for (const p of payload.parts) collect(p, out);
    return out;
  };
  for (const id of ids) {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: { Authorization: `Bearer ${token}` } });
    const j: any = await r.json();
    const parts = collect(j.payload);
    const headers = (j.payload?.headers ?? []);
    const messageId = headers.find((h:any) => h.name.toLowerCase() === "message-id")?.value ?? null;
    details.push({ 
      id, 
      status: r.status, 
      snippet: j.snippet ?? "", 
      parts, 
      headers: headers.filter((h:any)=> ["to","subject","from","date","message-id"].includes(h.name.toLowerCase())).slice(0,5),
      rfcId: messageId ? messageId.value.replace(/^<|>$/g, "").trim() : null
    });
  }
  return NextResponse.json({ ok: true, count: listJson.messages?.length ?? 0, ids, details, hasToken: true });
}
