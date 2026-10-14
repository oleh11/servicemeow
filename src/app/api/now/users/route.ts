import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { DEFAULT_AVATAR } from "@/lib/avatar-presets";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

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
    const status = error.status || (error.name === "AuthError" ? error.status : 500);
    return NextResponse.json({ error: error.message }, { status: status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
    }

    const rolesStr = Array.isArray(body.roles)
      ? body.roles.map((r: string) => r.trim()).filter(Boolean).join(",")
      : (body.roles || "");

    // No shared default password: if none is supplied, generate a random temporary one
    // and return it once in the response so the admin can hand it over.
    const generatedPassword = body.password ? null : randomBytes(12).toString("base64url");
    const rawPassword = body.password || generatedPassword!;
    const passwordHash = await hashPassword(rawPassword);

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase().trim(),
        userName: body.userName || body.email.split("@")[0],
        passwordHash,
        role: body.role || "employee",
        roles: rolesStr,
        department: body.department || "General IT",
        title: body.title || "Support Analyst",
        avatar: body.avatar || DEFAULT_AVATAR,
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

    return NextResponse.json(
      generatedPassword
        ? { result: created, temporaryPassword: generatedPassword }
        : { result: created },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    const status = error.status || (error.name === "AuthError" ? error.status : 500);
    return NextResponse.json({ error: error.message }, { status: status || 500 });
  }
}
