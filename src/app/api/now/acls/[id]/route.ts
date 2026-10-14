import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateAcl } from "@/lib/acl-engine";
import { getServerSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const acl = await db.sysSecurityAcl.findUnique({ where: { id } });
    if (!acl) return NextResponse.json({ error: "ACL not found" }, { status: 404 });
    return NextResponse.json({ result: acl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    const check = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "write",
      tableName: "sys_security_acl",
    });

    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.operation !== undefined) data.operation = body.operation.toLowerCase().trim();
    if (body.tableName !== undefined) data.tableName = body.tableName.toLowerCase().trim();
    if (body.fieldName !== undefined) data.fieldName = body.fieldName.trim();
    if (body.roleRequired !== undefined) {
      data.roleRequired = Array.isArray(body.roleRequired)
        ? body.roleRequired.map((r: string) => r.trim().toLowerCase()).filter(Boolean).join(",")
        : body.roleRequired.toLowerCase().trim();
    }
    if (body.condition !== undefined) data.condition = body.condition;
    if (body.description !== undefined) data.description = body.description;
    if (body.active !== undefined) data.active = body.active;

    const updated = await db.sysSecurityAcl.update({
      where: { id },
      data,
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    const check = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "delete",
      tableName: "sys_security_acl",
    });

    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    await db.sysSecurityAcl.delete({ where: { id } });
    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
