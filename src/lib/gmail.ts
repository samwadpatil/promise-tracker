// Gmail helpers - uses OAuth access_token from NextAuth session
export interface GmailMessageLite {
  id: string;
  threadId: string | null;
  rfcId: string | null; // Message-ID header for direct link
  to: string | null;
  subject: string | null;
  snippet: string | null;
  body: string;
  date: string | null;
}

function b64UrlDecode(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  return Buffer.from(padded, "base64").toString("utf-8");
}

export async function fetchGmailSent(accessToken: string, maxResults = 50): Promise<GmailMessageLite[]> {
  const q = encodeURIComponent("in:sent newer_than:30d");
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=${maxResults}`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!listRes.ok) {
    const t = await listRes.text();
    throw new Error(`Gmail list failed: ${listRes.status} ${t}`);
  }
  const listData = (await listRes.json()) as { messages?: { id: string; threadId: string }[] };
  const items = listData.messages ?? [];
  const results: GmailMessageLite[] = [];
  for (const item of items.slice(0, maxResults)) {
    const id = item.id;
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();
    const headers: Record<string, string> = {};
    for (const h of msg.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;
    const rawBody = extractBody(msg.payload);
    const subject = headers["subject"] ?? "";
    const combined = [subject, rawBody, msg.snippet ?? ""].filter(Boolean).join("\n").slice(0, 4000);
    const body = combined || rawBody || msg.snippet || "";
    const rfcRaw = headers["message-id"] ?? headers["message-id"] ?? null;
    const rfcId = rfcRaw ? rfcRaw.replace(/^<|>$/g, "").replace(/[<>]/g, "").trim() : null;
    results.push({
      id,
      threadId: msg.threadId ?? item.threadId ?? null,
      rfcId,
      to: headers["to"] ?? null,
      subject: headers["subject"] ?? null,
      snippet: msg.snippet ?? null,
      body,
      date: headers["date"] ?? null,
    });
  }
  return results;
}

function collectParts(payload: any, out: any[] = []) {
  if (!payload) return out;
  if (payload.mimeType && payload.body?.data) out.push(payload);
  if (payload.parts) for (const p of payload.parts) collectParts(p, out);
  return out;
}

function extractBody(payload: any): string {
  if (!payload) return "";
  const parts = collectParts(payload);
  for (const p of parts) {
    if (p.mimeType === "text/plain" && p.body?.data) {
      try { return b64UrlDecode(p.body.data); } catch {}
    }
  }
  for (const p of parts) {
    if (p.mimeType === "text/html" && p.body?.data) {
      try {
        const html = b64UrlDecode(p.body.data);
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
      } catch {}
    }
  }
  if (payload.body?.data) {
    try { return b64UrlDecode(payload.body.data); } catch {}
  }
  return payload.snippet ?? "";
}
