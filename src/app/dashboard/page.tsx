"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PromiseRow } from "@/lib/types";
import PromiseTable from "@/components/PromiseTable";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userEmail = (session?.user as any)?.email as string | undefined;
  const USER_ID = userEmail ?? "demo@promise-tracker.dev";

  const [promises, setPromises] = useState<PromiseRow[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "overdue" | "done" | "snoozed">("open");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setIsSignedIn(!!userEmail);
  }, [userEmail]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ userId: USER_ID });
    if (filter !== "all" && filter !== "overdue") params.set("status", filter);
    const res = await fetch(`/api/promises?${params.toString()}`);
    const data = await res.json();
    let list: PromiseRow[] = data.promises ?? [];
    if (filter === "overdue") {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter((p) => p.status === "open" && p.due_date && p.due_date < today);
    }
    setPromises(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, USER_ID]);

  async function handleScan() {
    setScanning(true);
    setMsg(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fakeUserId: USER_ID, pastedText: pastedText || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error ?? "Scan failed";
        if (err.includes("Invalid Credentials") || err.includes("401")) throw new Error("Gmail session expired — click Connect Gmail again");
        throw new Error(err);
      }
      setMsg(`Found ${data.count} commitment${data.count !== 1 ? "s" : ""} • Due dates inferred • Latest ${data.count} shown`);
      setPastedText("");
      await load();
    } catch (e: any) {
      const m = e.message.includes("401") || e.message.includes("Invalid Credentials") ? "Gmail session expired — Connect Gmail again" : e.message;
      setMsg(m);
    } finally {
      setScanning(false);
    }
  }

  async function handleUpdate(id: string, patch: any) {
    setPromises((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (patch.status === "snoozed" && !patch.snoozed_until) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      patch.snoozed_until = d.toISOString().slice(0, 10);
    }
    await fetch("/api/promises", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    await load();
  }

  async function handleDelete(id: string) {
    setPromises((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/promises?id=${id}`, { method: "DELETE" });
  }

  const stats = {
    open: promises.filter((p) => p.status === "open").length,
    overdue: promises.filter((p) => p.status === "open" && p.due_date && p.due_date < new Date().toISOString().slice(0, 10)).length,
    done: promises.filter((p) => p.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="Promise Tracker" className="h-9 w-9 rounded-xl shadow-sm" />
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-zinc-900">Promise Tracker</div>
              <div className="text-xs font-medium text-zinc-600">Your commitments • Understood</div>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:block">Home</a>
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-zinc-600 sm:block">{userEmail}</span>
                <a href="/api/auth/signout" className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Sign out</a>
              </div>
            ) : (
              <a href="/api/auth/signin" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-black">
                Connect Gmail
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-zinc-900">Dashboard</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-700">
              {isSignedIn ? "Connected to Gmail • Scanning last 7 days of sent messages." : "Paste any message below — we’ll extract what you promised and when it’s due."}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="min-w-[110px] rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Open</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{loading ? "—" : stats.open}</div>
            </div>
            <div className="min-w-[110px] rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Overdue</div>
              <div className={`mt-1 text-2xl font-semibold ${stats.overdue > 0 ? "text-red-600" : "text-zinc-900"}`}>{loading ? "—" : stats.overdue}</div>
            </div>
          </div>
        </div>

        {!isSignedIn && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-amber-900">Connect Gmail to scan automatically</div>
              <div className="text-sm text-amber-800">Or paste a message below to try instantly — no setup needed.</div>
            </div>
            <a href="/api/auth/signin" className="hidden rounded-full bg-amber-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black sm:block">Connect</a>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white text-sm">✦</div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Capture a promise</h2>
              <p className="text-sm text-zinc-600">We extract the action, who it’s for, and the due date — even “by Friday” or “EOD”.</p>
            </div>
          </div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Try: "Hi Rahul — I'll send the Q3 deck by Friday EOD and share the pricing sheet by tomorrow. Let me review PR #42 by EOD today."`}
            className="mt-4 min-h-[96px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={handleScan} disabled={scanning} className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-black disabled:opacity-50">
              {scanning ? "Scanning…" : isSignedIn ? "Scan Gmail + Pasted" : "Extract from text"}
            </button>
            <button onClick={load} className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Refresh
            </button>
            {msg && <span className="text-sm font-medium text-zinc-700">{msg}</span>}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-600">
            Gmail: <span className="font-semibold text-zinc-900">gmail.readonly</span> • Never stores email body • One-click disconnect
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["open", "overdue", "all", "done", "snoozed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-5 py-2.5 text-sm font-medium capitalize transition ${filter === f ? "bg-zinc-900 text-white border-zinc-900 shadow-sm" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"}`}
            >
              {f}
            </button>
          ))}
          <span className="ml-3 self-center text-sm font-medium text-zinc-600">{loading ? "Loading…" : `${promises.length} shown`}</span>
        </div>

        <div className="mt-4">
          {loading ? <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm font-medium text-zinc-600">Loading…</div> : <PromiseTable promises={promises} onUpdate={handleUpdate} onDelete={handleDelete} />}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <div className="text-sm font-medium text-zinc-600">Secure by design • Your Gmail is read-only • Data encrypted • Delete anytime from Supabase</div>
        </div>
      </main>
    </div>
  );
}
