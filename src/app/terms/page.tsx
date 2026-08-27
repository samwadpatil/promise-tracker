import Link from "next/link";
export const metadata = { title: "Terms of Service — Promise Tracker" };
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">P</div>
            <span className="text-sm font-semibold">Promise Tracker</span>
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">Privacy</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm leading-6 text-zinc-700">
        <h1 className="text-2xl font-semibold text-zinc-900">Terms of Service</h1>
        <p className="mt-2 text-zinc-600">Last updated: August 25, 2026</p>
        <h2 className="mt-8 font-semibold text-zinc-900">1. Service</h2>
        <p>Promise Tracker is provided as-is for personal productivity. No warranty. Use read-only Gmail scope at your discretion.</p>
        <h2 className="mt-6 font-semibold text-zinc-900">2. Acceptable use</h2>
        <p>Do not abuse Gmail/Slack APIs, attempt to access others’ data, or use the service for spam.</p>
        <h2 className="mt-6 font-semibold text-zinc-900">3. Accounts</h2>
        <p>You may disconnect and delete data anytime. We may suspend abusive accounts.</p>
        <h2 className="mt-6 font-semibold text-zinc-900">4. Liability</h2>
        <p>We are not liable for missed promises or inferred due-date errors. Verify important deadlines yourself.</p>
        <h2 className="mt-6 font-semibold text-zinc-900">5. Contact</h2>
        <p><a href="mailto:samwadp@gmail.com" className="underline">samwadp@gmail.com</a></p>
      </main>
    </div>
  );
}
