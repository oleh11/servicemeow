import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const groups = await db.group.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true, title: true, department: true } },
          },
        },
      },
    });

    // Fetch managers for groups with managerId
    const managerIds = groups.map((g) => g.managerId).filter(Boolean) as string[];
    const managers = managerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: managerIds } },
          select: { id: true, name: true, email: true, role: true, avatar: true },
        })
      : [];
    const managerMap = new Map(managers.map((m) => [m.id, m]));

    const formatted = groups.map((g) => {
      const parsedRoles = g.roles
        ? g.roles.split(",").map((r) => r.trim()).filter(Boolean)
        : [];

      return {
        ...g,
        roles: parsedRoles,
        rolesRaw: g.roles || "",
        manager: g.managerId ? managerMap.get(g.managerId) || null : null,
        memberCount: g.members.length,
        members: g.members.map((m) => m.user),
      };
    });

    return NextResponse.json({ result: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Security Access Denied: Administrator role (admin) required to create groups" },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const trimmedName = body.name.trim();

    // Check uniqueness
    const existing = await db.group.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Group '${trimmedName}' already exists` },
        { status: 409 }
      );
    }

    // Format roles string
    let rolesStr = "";
    if (Array.isArray(body.roles)) {
      rolesStr = body.roles.map((r: string) => r.trim()).filter(Boolean).join(",");
    } else if (typeof body.roles === "string") {
      rolesStr = body.roles.trim();
    }

    const group = await db.group.create({
      data: {
        name: trimmedName,
        description: body.description?.trim() || "",
        managerId: body.managerId || null,
        roles: rolesStr,
      },
    });

    // Add initial members if provided
    if (Array.isArray(body.memberIds) && body.memberIds.length > 0) {
      await db.userGroupMember.createMany({
        data: body.memberIds.map((userId: string) => ({
          groupId: group.id,
          userId,
        })),
      });
    }

    // Fetch created group with members
    const fullGroup = await db.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
        },
      },
    });

    const parsedRoles = fullGroup?.roles
      ? fullGroup.roles.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    return NextResponse.json(
      {
        result: {
          ...fullGroup,
          roles: parsedRoles,
          rolesRaw: fullGroup?.roles || "",
          memberCount: fullGroup?.members.length || 0,
          members: fullGroup?.members.map((m) => m.user) || [],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
