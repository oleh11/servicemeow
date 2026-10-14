import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getActiveUpdateSet } from "@/lib/update-set";

export async function GET() {
  try {
    // Ensure default active update set exists
    await getActiveUpdateSet();

    const sets = await db.sysUpdateSet.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ result: sets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, state } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const targetState = state || "in_progress";
    const application = body.application || "global";

    if (targetState === "in_progress") {
      await db.sysUpdateSet.updateMany({
        data: { isCurrent: false },
      });
    }

    const newSet = await db.sysUpdateSet.create({
      data: {
        name,
        description: description || null,
        state: targetState,
        application,
        isCurrent: targetState === "in_progress",
        payloadJson: "[]",
      },
    });

    return NextResponse.json({ result: newSet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
