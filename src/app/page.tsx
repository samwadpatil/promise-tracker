import Link from "next/link";

export const dynamic = "force-dynamic";

function CheckIcon() {
  return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">✓</span>;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="Promise Tracker" className="h-9 w-9 rounded-xl shadow-sm" />
            <span className="text-sm font-semibold tracking-tight">Promise Tracker</span>
            <span className="hidden rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white sm:inline">Private beta</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="/api/auth/signin?callbackUrl=/dashboard" className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block">Sign in</a>
            <Link href="/dashboard" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black">
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl py-16 text-center md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Gmail • Slack • AI • Daily digest 9am
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl md:leading-[1.05]">
            Stay on top of every
            <br />
            <span className="bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">“I’ll send it”</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-zinc-700">
            Promise Tracker reads your sent Gmail and Slack, extracts commitments, infers due dates like <span className="font-semibold text-zinc-900">“by Friday”</span> and <span className="font-semibold text-zinc-900">“EOD”</span>, and keeps one clear list. Never follow up on yourself again.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/api/auth/signin?callbackUrl=/dashboard" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-black">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Continue with Google
            </a>
            <a href="#preview" className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-zinc-200 bg-white px-8 py-3.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50">
              See live preview
            </a>
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-600">Read-only Gmail • Slack optional • One-click disconnect • No email content stored</p>
        </div>

        {/* Premium mockup preview */}
        <div id="preview" className="mx-auto max-w-5xl">
          <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-3 shadow-2xl md:p-4">
            <div className="rounded-[16px] border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="ml-4 flex-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500">app.promise-tracker.com/dashboard</div>
                <div className="hidden items-center gap-2 text-xs font-medium text-zinc-600 md:flex">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">All synced • 2 overdue</span>
                </div>
              </div>
              {/* Mock table */}
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Today</div>
                    <div className="text-xs text-zinc-600">2 due • 1 overdue • Extracted from last 7 days</div>
                  </div>
                  <div className="hidden gap-2 md:flex">
                    <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">Open</span>
                    <span className="rounded-full border px-3 py-1.5 text-xs font-medium text-zinc-700">Overdue</span>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { title: "Send Q3 deck to Rahul", to: "rahul@acme.co", due: "Tomorrow • Fri, Aug 29", status: "Open", dot: "bg-amber-500" },
                    { title: "Share pricing sheet", to: "priya@partner.io", due: "Today", status: "Open", dot: "bg-amber-500" },
                    { title: "Send references for hiring", to: "hiring@startup.xyz", due: "Overdue • Mon", status: "Overdue", dot: "bg-red-500" },
                  ].map((r) => (
                    <div key={r.title} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${r.dot}`} />
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">{r.title}</div>
                          <div className="text-xs font-medium text-zinc-600">
                            to {r.to} • {r.due}
                          </div>
                        </div>
                      </div>
                      <div className="hidden items-center gap-2 md:flex">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${r.status === "Overdue" ? "bg-red-50 text-red-700 border-red-200" : "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>{r.status}</span>
                        <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">Draft nudge</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 flex items-center justify-between border border-dashed">
                  <div className="text-xs font-medium text-zinc-700">AI infers “by Friday” → <span className="font-semibold">2026-08-29</span> • “EOD” → <span className="font-semibold">today 18:00</span></div>
                  <CheckIcon />
                </div>
              </div>
            </div>
            <div className="mt-3 text-center text-xs font-medium text-zinc-600">Preview — real app shows your Gmail data after sign-in. No mock data stored.</div>
          </div>
        </div>

        {/* Social proof / trust */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-zinc-600">
          <span className="flex items-center gap-2"><CheckIcon /> Gmail readonly</span>
          <span className="flex items-center gap-2"><CheckIcon /> Slack optional</span>
          <span className="flex items-center gap-2"><CheckIcon /> Daily digest 9am</span>
          <span className="flex items-center gap-2"><CheckIcon /> Encrypted tokens</span>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 border-t border-zinc-200 py-12 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">◐</div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Captures what you promised</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-700">Not what others owe you. Scans only <span className="font-semibold">your sent</span> messages for “I’ll send”, “let me share”, “by Friday”.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">✦</div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Understands due dates</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-700">Heuristics miss context. Our AI resolves “tomorrow”, “EOD”, “next week” to real dates and confidence.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">✉</div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Nudges you before you’re late</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-700">Daily 9am digest + one-click draft: “Running behind, will share by…” or “Done — here it is”.</p>
          </div>
        </div>

        <div className="grid gap-6 pb-12 md:grid-cols-3 text-sm">
          <div className="rounded-2xl bg-zinc-50 border p-6">
            <div className="text-sm font-semibold text-zinc-900">How it works</div>
            <ol className="mt-3 space-y-2 text-zinc-700 list-decimal list-inside leading-6">
              <li>Connect Gmail (readonly)</li>
              <li>We scan last 7 days sent</li>
              <li>Get digest + draft nudges</li>
            </ol>
          </div>
          <div className="rounded-2xl bg-zinc-50 border p-6">
            <div className="text-sm font-semibold text-zinc-900">Privacy</div>
            <p className="mt-3 leading-6 text-zinc-700">OAuth `gmail.readonly`. We never store email bodies, only the promise sentence + due. One-click revoke & delete.</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 border p-6">
            <div className="text-sm font-semibold text-zinc-900">Built for</div>
            <p className="mt-3 leading-6 text-zinc-700">PMs, founders, freelancers making 20+ promises/week across Gmail & Slack. Replaces spreadsheet + memory.</p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="rounded-2xl bg-zinc-900 px-6 py-8 text-white md:flex md:items-center md:justify-between md:px-10">
          <div>
            <div className="text-lg font-semibold tracking-tight">See your promises in 30 seconds</div>
            <div className="mt-1 text-sm text-zinc-300">Sign in with Google — no credit card, disconnect anytime.</div>
          </div>
          <a href="/api/auth/signin?callbackUrl=/dashboard" className="mt-6 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 md:mt-0">
            Continue with Google →
          </a>
        </div>

        <div className="py-10 text-center text-xs font-medium text-zinc-600">
          Crafted with Next.js • Supabase • Gmail/Slack APIs • Vercel • <Link href="/dashboard" className="underline">Open app</Link>
        </div>
      </main>
    </div>
  );
}
