import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const notifications = await db.sysEmailNotification.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ result: notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tableName, eventTrigger, condition, subject, bodyTemplate, recipientRoles, active } = body;

    if (!name || !tableName || !eventTrigger || !subject || !bodyTemplate) {
      return NextResponse.json(
        { error: "name, tableName, eventTrigger, subject, bodyTemplate are required." },
        { status: 400 }
      );
    }

    const created = await db.sysEmailNotification.create({
      data: {
        name,
        tableName,
        eventTrigger,
        condition: condition || null,
        subject,
        bodyTemplate,
        recipientRoles: recipientRoles || "itil,admin",
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
