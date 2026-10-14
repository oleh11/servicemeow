import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateAcl, seedDefaultAclsIfEmpty } from "@/lib/acl-engine";

export async function GET(request: NextRequest) {
  try {
    await seedDefaultAclsIfEmpty();
    const tableParam = request.nextUrl.searchParams.get("table");
    const roleParam = request.nextUrl.searchParams.get("role");

    const where: any = {};
    if (tableParam) where.tableName = tableParam;
    if (roleParam) where.roleRequired = roleParam;

    const acls = await db.sysSecurityAcl.findMany({
      where,
      orderBy: [{ tableName: "asc" }, { operation: "asc" }],
    });

    return NextResponse.json({ result: acls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Check if caller can modify ACLs
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
    if (!body.name || !body.operation || !body.tableName || !body.roleRequired) {
      return NextResponse.json(
        { error: "name, operation, tableName, and roleRequired are mandatory for an ACL" },
        { status: 400 }
      );
    }

    const created = await db.sysSecurityAcl.create({
      data: {
        name: body.name,
        operation: body.operation.toLowerCase().trim(),
        tableName: body.tableName.toLowerCase().trim(),
        fieldName: body.fieldName ? body.fieldName.trim() : "*",
        roleRequired: Array.isArray(body.roleRequired)
          ? body.roleRequired.map((r: string) => r.trim().toLowerCase()).filter(Boolean).join(",")
          : body.roleRequired.toLowerCase().trim(),
        condition: body.condition || null,
        description: body.description || null,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
