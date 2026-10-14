import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const includes = await db.sysScriptInclude.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: includes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, apiName, script, clientCallable, description, active } = body;

    if (!name || !script) {
      return NextResponse.json(
        { error: "Name and script are required." },
        { status: 400 }
      );
    }

    const calculatedApiName = apiName || `global.${name}`;

    const created = await db.sysScriptInclude.create({
      data: {
        name,
        apiName: calculatedApiName,
        script,
        clientCallable: Boolean(clientCallable),
        description: description || null,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "sys_script_include",
      action: "insert",
      recordId: created.id,
      name: created.name,
      data: created,
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
