import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    // Users can read their own profile, otherwise requires admin
    if (!session.isAdmin && session.user.id !== id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id },
      include: {
        groupMembers: {
          include: { group: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      result: {
        ...user,
        groups: user.groupMembers.map((gm) => gm.group),
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    // Only admins can alter role, roles, active status, or other users' profiles
    const isSelf = session.user.id === id;
    if (!session.isAdmin && !isSelf) {
      return NextResponse.json({ error: "Administrative privileges required" }, { status: 403 });
    }

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined && session.isAdmin) data.email = body.email.toLowerCase().trim();
    if (body.department !== undefined) data.department = body.department;
    if (body.title !== undefined) data.title = body.title;
    if (body.avatar !== undefined) data.avatar = body.avatar;

    // Privilege escalation prevention: only admins can alter role, roles, or active state
    if (session.isAdmin) {
      if (body.role !== undefined) data.role = body.role;
      if (body.roles !== undefined) {
        data.roles = Array.isArray(body.roles)
          ? body.roles.map((r: string) => r.trim()).filter(Boolean).join(",")
          : body.roles;
      }
      if (body.active !== undefined) data.active = body.active;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data,
    });

    // If groupIds is provided and caller is admin, sync group memberships
    if (session.isAdmin && Array.isArray(body.groupIds)) {
      await db.userGroupMember.deleteMany({ where: { userId: id } });
      if (body.groupIds.length > 0) {
        await db.userGroupMember.createMany({
          data: body.groupIds.map((gid: string) => ({
            userId: id,
            groupId: gid,
          })),
        });
      }
    }

    const fullUser = await db.user.findUnique({
      where: { id },
      include: {
        groupMembers: {
          include: { group: true },
        },
      },
    });

    return NextResponse.json({
      result: {
        ...fullUser,
        groups: fullUser?.groupMembers.map((gm) => gm.group) || [],
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Remove group memberships first
    await db.userGroupMember.deleteMany({ where: { userId: id } });

    // Try hard delete
    try {
      await db.user.delete({ where: { id } });
      return NextResponse.json({ result: { status: "deleted", id } });
    } catch {
      // If user has foreign key references, deactivate user
      await db.user.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({
        result: { status: "deactivated", id, message: "User deactivated to preserve historical audit records" },
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
