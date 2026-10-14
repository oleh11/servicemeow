import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true, title: true, department: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const manager = group.managerId
      ? await db.user.findUnique({
          where: { id: group.managerId },
          select: { id: true, name: true, email: true, role: true, avatar: true },
        })
      : null;

    const parsedRoles = group.roles
      ? group.roles.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      result: {
        ...group,
        roles: parsedRoles,
        rolesRaw: group.roles || "",
        manager,
        memberCount: group.members.length,
        members: group.members.map((m) => m.user),
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
        { error: "Security Access Denied: Administrator role (admin) required to update groups" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.group.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check name collision if name changed
    if (body.name && body.name.trim() !== existing.name) {
      const trimmedName = body.name.trim();
      const nameConflict = await db.group.findUnique({
        where: { name: trimmedName },
      });
      if (nameConflict && nameConflict.id !== id) {
        return NextResponse.json(
          { error: `Group '${trimmedName}' already exists` },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || "";
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null;

    if (body.roles !== undefined) {
      if (Array.isArray(body.roles)) {
        updateData.roles = body.roles.map((r: string) => r.trim()).filter(Boolean).join(",");
      } else if (typeof body.roles === "string") {
        updateData.roles = body.roles.trim();
      }
    }

    await db.group.update({
      where: { id },
      data: updateData,
    });

    // Synchronize members if memberIds array provided
    if (Array.isArray(body.memberIds)) {
      // Remove all current members
      await db.userGroupMember.deleteMany({
        where: { groupId: id },
      });

      // Insert new members
      if (body.memberIds.length > 0) {
        await db.userGroupMember.createMany({
          data: body.memberIds.map((userId: string) => ({
            groupId: id,
            userId,
          })),
        });
      }
    }

    // Fetch updated group with members
    const updated = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
        },
      },
    });

    const manager = updated?.managerId
      ? await db.user.findUnique({
          where: { id: updated.managerId },
          select: { id: true, name: true, email: true, role: true, avatar: true },
        })
      : null;

    const parsedRoles = updated?.roles
      ? updated.roles.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    return NextResponse.json({
      result: {
        ...updated,
        roles: parsedRoles,
        rolesRaw: updated?.roles || "",
        manager,
        memberCount: updated?.members.length || 0,
        members: updated?.members.map((m) => m.user) || [],
      },
    });
  } catch (error: any) {
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
        { error: "Security Access Denied: Administrator role (admin) required to delete groups" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.group.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Delete members first
    await db.userGroupMember.deleteMany({ where: { groupId: id } });

    // Delete group
    await db.group.delete({ where: { id } });

    return NextResponse.json({
      result: { message: `Group '${existing.name}' deleted successfully` },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
