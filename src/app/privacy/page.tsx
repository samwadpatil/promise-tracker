import Link from "next/link";

export const metadata = { title: "Privacy Policy — Promise Tracker" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">P</div>
            <span className="text-sm font-semibold">Promise Tracker</span>
          </Link>
          <Link href="/terms" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">Terms</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm leading-6 text-zinc-700">
        <h1 className="text-2xl font-semibold text-zinc-900">Privacy Policy</h1>
        <p className="mt-2 text-zinc-600">Last updated: August 25, 2026</p>

        <h2 className="mt-8 font-semibold text-zinc-900">1. Overview</h2>
        <p>Promise Tracker helps you track commitments you made in Gmail and Slack. This policy explains what data we access and how we handle it.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">2. Data we access</h2>
        <ul className="list-disc pl-5">
          <li><b>Gmail (readonly, gmail.readonly):</b> We read only your <b>sent</b> messages from the last 30 days (<code>in:sent newer_than:30d</code>) to extract promise sentences and due dates. We do not read inbox, drafts, or attachments.</li>
          <li><b>Slack (optional):</b> If you connect Slack, we read your sent messages in channels/DMs you authorize for the same purpose.</li>
          <li><b>What we store:</b> For each promise: the promise text, recipient, due date, context snippet, Gmail message ID and RFC Message-ID for linking, status. We do <b>not</b> store full email bodies after extraction.</li>
          <li><b>Account info:</b> Name, email, OAuth tokens (encrypted) via NextAuth.</li>
        </ul>

        <h2 className="mt-6 font-semibold text-zinc-900">3. How we use data</h2>
        <p>To show your dashboard, infer due dates (e.g., “Friday” → date), and send a daily digest (if you enable it). We do not use Gmail data for advertising, profiling, or any third party.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">4. Sharing</h2>
        <p>We do not sell or share Gmail data. Third parties: Supabase (database), Resend (email digest), Vercel (hosting), OpenAI/Gemini (optional AI extraction) — only the promise snippet is sent, never raw email bodies beyond the snippet, and only if you enable AI.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">5. Retention & deletion</h2>
        <p>Promises remain until you delete them (Dashboard → Delete) or disconnect. Disconnect revokes OAuth and you can request deletion via <a href="mailto:samwadp@gmail.com" className="underline">samwadp@gmail.com</a>. Tokens are revoked on sign-out.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">6. Security</h2>
        <p>OAuth tokens stored encrypted, Supabase Row Level Security enabled, least-privilege scopes. Transport is HTTPS.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">7. Google API disclosure</h2>
        <p>Promise Tracker’s use of Google APIs complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline">Google API Services User Data Policy</a>, including Limited Use. Gmail data is used only to provide the promise-tracking feature and is not transferred to others.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">8. Your rights</h2>
        <p>Access, correct, or delete your data anytime via the dashboard or by emailing <a href="mailto:samwadp@gmail.com" className="underline">samwadp@gmail.com</a>.</p>

        <h2 className="mt-6 font-semibold text-zinc-900">9. Contact</h2>
        <p>Questions: <a href="mailto:samwadp@gmail.com" className="underline">samwadp@gmail.com</a></p>

        <div className="mt-10 rounded-xl border bg-zinc-50 p-4 text-xs text-zinc-600">
          This is a portfolio MVP. For production verification, provide a detailed data-flow video on request.
        </div>
      </main>
    </div>
  );
}
