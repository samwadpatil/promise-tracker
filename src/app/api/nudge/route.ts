import { NextRequest, NextResponse } from "next/server";
import { generateNudgeDraft } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { promiseText, recipient, dueDate, overdue } = await req.json();
  if (!promiseText) return NextResponse.json({ error: "promiseText required" }, { status: 400 });
  const drafts = await generateNudgeDraft({ promiseText, recipient: recipient ?? null, dueDate: dueDate ?? null, overdue: !!overdue });
  return NextResponse.json(drafts);
}
