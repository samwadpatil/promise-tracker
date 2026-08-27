# Promise Tracker

> Never miss an “I’ll send it” again. Scans last 30 days of sent Gmail and Slack, extracts commitments, infers due dates, and keeps one clear list with daily 9am digest.

**Stack:** Next.js 16 + Tailwind 4 + NextAuth (Google + Slack) + Supabase + Resend + Vercel Cron — heuristic extraction with optional OpenAI/Gemini.

### Features
- **Gmail + Slack OAuth** — read-only `gmail.readonly`, `channels:history`
- **Smart extraction** — fixes typos, handles “I shall”, “will be done by Saturday”, and multiple promises per mail
- **Due inference** — “tomorrow”, “EOD”, “Friday”, “next week” → `YYYY-MM-DD`
- **Dedup + persistence** — Supabase, no duplicate stacking, `rfc822msgid` direct Gmail links
- **Premium UI** — dashboard shows latest 20, overdue highlights, one-click draft nudges

### Quick start
```bash
npm install
npm run dev
# http://localhost:3000 -> paste a message -> Extract from text
```
Paste example:
```
Hi Rahul — I'll send the Q3 deck by Friday EOD and share the pricing sheet by tomorrow.
```
Works without any API keys via heuristic. Add `OPENAI_API_KEY` or `GEMINI_API_KEY` for higher precision.

### Full setup
1. Supabase: create project → run `supabase.sql` and `supabase_migration_gmail_link.sql` → copy URL + anon + service_role to `.env.local`
2. Google Cloud: enable Gmail API → OAuth consent + credentials → `GOOGLE_CLIENT_ID/SECRET`, redirect `http://localhost:3000/api/auth/callback/google` (add prod URL after deploy)
3. Slack (optional): `api.slack.com` → scopes `channels:history,channels:read,im:history,im:read,users:read` → `SLACK_CLIENT_ID/SECRET`
4. AI (optional): `OPENAI_API_KEY` or `GEMINI_API_KEY`
5. Email: `RESEND_API_KEY` + `RESEND_FROM`
6. `DEMO_MODE=false`, `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `CRON_SECRET`
7. `npm run dev` → Dashboard → Connect Gmail → Scan

### Daily digest
- Vercel Cron: `vercel.json` hits `GET /api/digest` daily 03:00 UTC. Requires `Authorization: Bearer $CRON_SECRET`.
- Manual: `GET /api/digest?userId=you@email.com&to=you@email.com` with same header.

### Deploy
```bash
vercel --prod
# add same env vars in Vercel dashboard, update NEXTAUTH_URL to prod URL, add prod OAuth redirects, redeploy
```

### Architecture
- `src/lib/ai.ts` — extraction with weekday fallback
- `src/lib/gmail.ts` — fetch last 30d sent, base64url decode, subject+body merge
- `src/app/api/extract` — Gmail/Slack → AI → Supabase (deduped by `source_id`)
- `src/app/dashboard` — latest 20, filters, `GMAIL ↗` via `rfc822msgid`
- `supabase.sql` — `users`, `promises` (with `gmail_rfc_id`)
