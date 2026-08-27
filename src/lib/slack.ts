export interface SlackMessageLite {
  id: string; // ts-channel
  channel: string;
  text: string;
  ts: string;
}

export async function fetchSlackSent(accessToken: string, days = 7): Promise<SlackMessageLite[]> {
  const oldest = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  // 1) find user id
  const authRes = await fetch("https://slack.com/api/auth.test", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const authData = await authRes.json();
  if (!authData.ok) throw new Error(`Slack auth.test failed: ${authData.error}`);
  const userId: string = authData.user_id;

  // 2) list channels
  const convoRes = await fetch("https://slack.com/api/conversations.list?limit=100&exclude_archived=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const convoData = await convoRes.json();
  const channels: { id: string; name: string }[] = (convoData.channels ?? [])
    .filter((c: any) => !c.is_archived)
    .slice(0, 12)
    .map((c: any) => ({ id: c.id, name: c.name ?? c.id }));

  // also include IMs
  const imRes = await fetch("https://slack.com/api/conversations.list?types=im&limit=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const imData = await imRes.json();
  for (const ch of imData.channels ?? []) channels.push({ id: ch.id, name: ch.id });

  const out: SlackMessageLite[] = [];
  for (const ch of channels.slice(0, 15)) {
    const histRes = await fetch(
      `https://slack.com/api/conversations.history?channel=${ch.id}&oldest=${oldest}&limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const hist = await histRes.json();
    if (!hist.ok) continue;
    for (const m of hist.messages ?? []) {
      if (m.user === userId && m.text) {
        out.push({ id: `${m.ts}-${ch.id}`, channel: ch.name, text: m.text.slice(0, 3000), ts: m.ts });
      }
    }
    if (out.length > 40) break;
  }
  return out.slice(0, 40);
}
