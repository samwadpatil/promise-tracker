"use client";
import { useState } from "react";
import { PromiseRow } from "@/lib/types";

function badge(status: string) {
  if (status === "done") return "bg-green-100 text-green-800 border-green-200";
  if (status === "snoozed") return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
}

function dueLabel(due: string | null) {
  if (!due) return <span className="text-zinc-500 font-medium">No date</span>;
  const today = new Date().toISOString().slice(0, 10);
  if (due < today) return <span className="font-semibold text-red-600">{due} • Overdue</span>;
  if (due === today) return <span className="font-semibold text-amber-600">{due} • Today</span>;
  return <span className="text-zinc-800 font-medium">{due}</span>;
}

function gmailLink(p: PromiseRow): string | null {
  if (p.source !== "gmail") return null;
  // Prefer RFC Message-ID for direct open: https://mail.google.com/mail/u/0/#search/rfc822msgid:xxx
  const rfc = (p as any).gmail_rfc_id as string | null;
  if (rfc) {
    const clean = rfc.replace(/^<|>$/g, "").trim();
    return `https://mail.google.com/mail/u/0/#search/rfc822msgid%3A${encodeURIComponent(clean)}`;
  }
  const baseId = p.source_id.split("-")[0];
  return `https://mail.google.com/mail/u/0/#search/in%3Asent%20rfc822msgid%3A${encodeURIComponent(baseId)}`;
}

export default function PromiseTable({
  promises,
  onUpdate,
  onDelete,
}: {
  promises: PromiseRow[];
  onUpdate: (id: string, patch: Partial<PromiseRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { delayed: string; delivered: string } | null>>({});
  const [loadingDraft, setLoadingDraft] = useState<string | null>(null);

  async function handleDraft(p: PromiseRow) {
    setLoadingDraft(p.id);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const overdue = !!p.due_date && p.due_date < today;
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promiseText: p.promise_text, recipient: p.recipient, dueDate: p.due_date, overdue }),
      });
      const data = await res.json();
      setDrafts((d) => ({ ...d, [p.id]: data }));
    } finally {
      setLoadingDraft(null);
    }
  }

  if (promises.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-zinc-50/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white border shadow-sm">
          <span className="text-xl">✓</span>
        </div>
        <div className="mt-4 text-sm font-semibold text-zinc-900">No promises here</div>
        <div className="mt-1 text-sm text-zinc-600 max-w-sm mx-auto">You’re all clear. Connect Gmail or paste a message above and click Scan to extract commitments automatically.</div>
        <div className="mt-3 text-xs text-zinc-500">Encrypted • Read-only • Deletes on request</div>
      </div>
    );
  }

  // group by gmail thread to show “2 promises from same mail”
  const grouped = new Map<string, PromiseRow[]>();
  for (const p of promises) {
    const key = p.source === "gmail" ? p.source_id.split("-")[0] : p.id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50/80 text-left text-xs uppercase tracking-widest text-zinc-600 border-b">
          <tr>
            <th className="px-4 py-3">Promise</th>
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {promises.map((p) => {
            const link = gmailLink(p);
            const group = grouped.get(p.source === "gmail" ? p.source_id.split("-")[0] : p.id) ?? [];
            const isMulti = group.length > 1;
            return (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3 max-w-[380px]">
                  <div className="font-semibold text-zinc-900">{p.promise_text}</div>
                  {p.context_snippet && <div className="mt-1 text-xs leading-5 text-zinc-600 line-clamp-2">“{p.context_snippet}”</div>}
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-600">
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 uppercase tracking-wide font-medium hover:bg-zinc-50">
                        <span className="h-2 w-2 rounded-full bg-red-500" /> {p.source} ↗
                      </a>
                    ) : (
                      <span className="rounded-md border bg-zinc-50 px-1.5 py-0.5 uppercase tracking-wide font-medium">{p.source}</span>
                    )}
                    {isMulti && <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800 font-medium">{group.length} in same mail</span>}
                  </div>
                  {drafts[p.id] && (
                    <div className="mt-3 rounded-lg border bg-zinc-50 p-3">
                      <div className="text-xs font-semibold text-zinc-700">Drafts</div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">If delayed</div>
                          <div className="rounded border bg-white p-2 text-xs">{drafts[p.id]!.delayed}</div>
                          <button onClick={() => navigator.clipboard.writeText(drafts[p.id]!.delayed)} className="mt-1 text-xs text-zinc-600 underline">Copy</button>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">If delivered</div>
                          <div className="rounded border bg-white p-2 text-xs">{drafts[p.id]!.delivered}</div>
                          <button onClick={() => navigator.clipboard.writeText(drafts[p.id]!.delivered)} className="mt-1 text-xs text-zinc-600 underline">Copy</button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-800 font-medium">{p.recipient ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dueLabel(p.due_date)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badge(p.status)}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {p.status !== "done" && (
                      <button onClick={() => onUpdate(p.id, { status: "done" } as any)} className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black">
                        Mark done
                      </button>
                    )}
                    {p.status === "open" && (
                      <button onClick={() => onUpdate(p.id, { status: "snoozed" } as any)} className="rounded-full border px-3 py-1.5 text-xs hover:bg-zinc-50">
                        Snooze 3d
                      </button>
                    )}
                    <button onClick={() => handleDraft(p)} disabled={loadingDraft === p.id} className="rounded-full border px-3 py-1.5 text-xs hover:bg-zinc-50 disabled:opacity-50">
                      {loadingDraft === p.id ? "Drafting…" : "Draft nudge"}
                    </button>
                    <button onClick={() => onDelete(p.id)} className="rounded-full px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
