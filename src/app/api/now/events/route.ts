import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueEvent } from "@/lib/event-notification-engine";

export async function GET(request: NextRequest) {
  try {
    const events = await db.sysEvent.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ result: events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tableName, instanceId, parm1, parm2 } = body;

    if (!name || !tableName || !instanceId) {
      return NextResponse.json(
        { error: "name, tableName, and instanceId are required." },
        { status: 400 }
      );
    }

    const event = await enqueueEvent(name, tableName, instanceId, parm1, parm2);
    return NextResponse.json({ result: event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
