import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const users = await db.user.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        groupMembers: {
          include: {
            group: { select: { id: true, name: true, roles: true } },
          },
        },
      },
    });

    const formatted = users.map((u) => ({
      ...u,
      groups: u.groupMembers.map((gm) => gm.group),
    }));

    return NextResponse.json({ result: formatted });
  } catch (error: any) {
    console.error("GET /api/now/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
    }

    // Default cat avatar if none provided
    const defaultAvatar =
      body.avatar ||
      `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=128&h=128&fit=crop&crop=faces`;

    const rolesStr = Array.isArray(body.roles)
      ? body.roles.map((r: string) => r.trim()).filter(Boolean).join(",")
      : (body.roles || "");

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase().trim(),
        role: body.role || "employee",
        roles: rolesStr,
        department: body.department || "General IT",
        title: body.title || "Support Analyst",
        avatar: defaultAvatar,
        active: body.active !== false,
      },
    });

    // Handle initial group memberships if provided
    if (Array.isArray(body.groupIds) && body.groupIds.length > 0) {
      await db.userGroupMember.createMany({
        data: body.groupIds.map((gid: string) => ({
          userId: user.id,
          groupId: gid,
        })),
      });
    }

    const created = await db.user.findUnique({
      where: { id: user.id },
      include: {
        groupMembers: {
          include: { group: true },
        },
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/now/users error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
