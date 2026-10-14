import { NextRequest, NextResponse } from "next/server";
import { previewUpdateSet, commitUpdateSet } from "@/lib/update-set";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { action, name, payload } = body;

    if (!payload) {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }

    if (action === "preview") {
      const preview = previewUpdateSet(payload);
      return NextResponse.json({ result: preview });
    }

    // Default: commit
    const result = await commitUpdateSet(name || "Committed Update Set", payload);
    return NextResponse.json({ result });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
