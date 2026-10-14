import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

const PROTECTED_ROLES = ["admin", "itil", "employee", "cab_approver"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await db.sysUserRole.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Find users with this role
    const users = await db.user.findMany({
      where: {
        OR: [
          { role: role.name },
          { roles: { contains: role.name } },
        ],
      },
      select: { id: true, name: true, email: true, role: true, department: true },
    });

    // Find groups with this role
    const groups = await db.group.findMany({
      where: {
        roles: { contains: role.name },
      },
      select: { id: true, name: true, description: true },
    });

    return NextResponse.json({
      result: {
        ...role,
        assignedUsers: users,
        assignedGroups: groups,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only Platform Administrators can modify system roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.label !== undefined) data.label = body.label.trim();
    if (body.description !== undefined) data.description = body.description.trim();
    if (body.elevatedPrivilege !== undefined) data.elevatedPrivilege = Boolean(body.elevatedPrivilege);
    if (body.active !== undefined) data.active = Boolean(body.active);

    const updated = await db.sysUserRole.update({
      where: { id },
      data,
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    console.error("PATCH /api/now/roles/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only Platform Administrators can delete system roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const role = await db.sysUserRole.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (PROTECTED_ROLES.includes(role.name.toLowerCase())) {
      return NextResponse.json(
        { error: `Protected Core Role: '${role.name}' cannot be deleted as it is vital to platform operations.` },
        { status: 400 }
      );
    }

    await db.sysUserRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Role '${role.name}' deleted successfully.` });
  } catch (error: any) {
    console.error("DELETE /api/now/roles/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
