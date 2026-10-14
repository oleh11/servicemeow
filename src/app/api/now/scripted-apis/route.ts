import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const apis = await db.sysWsDefinition.findMany({
      include: {
        operations: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: apis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, basePath, description, active = true, operations = [] } = body;

    if (!name || !basePath) {
      return NextResponse.json(
        { error: "name and basePath are required." },
        { status: 400 }
      );
    }

    const cleanBasePath = basePath.replace(/^\/+|\/+$/g, "");

    const apiDef = await db.sysWsDefinition.create({
      data: {
        name,
        basePath: cleanBasePath,
        description: description || null,
        active: Boolean(active),
      },
    });

    if (Array.isArray(operations)) {
      for (const op of operations) {
        await db.sysWsOperation.create({
          data: {
            webServiceDefinitionId: apiDef.id,
            httpMethod: (op.httpMethod || "GET").toUpperCase(),
            uriTemplate: op.uriTemplate || "/",
            script: op.script || `return { message: "Hello from ${name} Scripted REST API!" };`,
          },
        });
      }
    }

    const fullApi = await db.sysWsDefinition.findUnique({
      where: { id: apiDef.id },
      include: { operations: true },
    });

    return NextResponse.json({ result: fullApi }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
