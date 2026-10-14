import { NextRequest, NextResponse } from "next/server";
import { getAuditHistory } from "@/lib/audit";
import { evaluateAcl } from "@/lib/acl-engine";
import { getServerSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  try {
    const { table, id } = await params;

    // Resolve caller identity and roles strictly from DB session
    const session = await getServerSession(request);
    const callerRoles = session ? session.roles : ["public"];
    const callerUserId = session?.user.id;

    // Enforce ACL
    const aclCheck = await evaluateAcl({
      roles: callerRoles,
      userId: callerUserId,
      operation: "read",
      tableName: table,
    });
    if (!aclCheck.allowed) {
      return NextResponse.json({ error: aclCheck.reason }, { status: 403 });
    }

    const history = await getAuditHistory(table, id);
    return NextResponse.json({ result: history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
