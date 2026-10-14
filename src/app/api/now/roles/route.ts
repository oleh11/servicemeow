import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedDefaultRolesIfEmpty } from "@/lib/acl-engine";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await seedDefaultRolesIfEmpty();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { label: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const roles = await db.sysUserRole.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Fetch users, groups, and ACLs to calculate usage stats for each role
    const [allUsers, allGroups, allAcls] = await Promise.all([
      db.user.findMany({ select: { role: true, roles: true } }),
      db.group.findMany({ select: { roles: true } }),
      db.sysSecurityAcl.findMany({ select: { roleRequired: true } }),
    ]);

    const formatted = roles.map((r) => {
      const roleName = r.name.toLowerCase();

      // Count direct users
      const directUsers = allUsers.filter((u) => {
        if (u.role && u.role.toLowerCase() === roleName) return true;
        if (u.roles) {
          const directRoles = u.roles.split(",").map((s) => s.trim().toLowerCase());
          return directRoles.includes(roleName);
        }
        return false;
      }).length;

      // Count groups with this role
      const groupCount = allGroups.filter((g) => {
        if (!g.roles) return false;
        const gRoles = g.roles.split(",").map((s) => s.trim().toLowerCase());
        return gRoles.includes(roleName);
      }).length;

      // Count ACLs referencing this role
      const aclCount = allAcls.filter((a) => {
        if (!a.roleRequired) return false;
        const reqRoles = a.roleRequired.split(",").map((s) => s.trim().toLowerCase());
        return reqRoles.includes(roleName);
      }).length;

      return {
        ...r,
        directUserCount: directUsers,
        groupCount,
        aclCount,
      };
    });

    return NextResponse.json({ result: formatted });
  } catch (error: any) {
    console.error("GET /api/now/roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only Platform Administrators can create system roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawName = body.name || "";
    const cleanName = rawName
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    if (!cleanName) {
      return NextResponse.json(
        { error: "Role name (identifier) is required and must contain alphanumeric characters" },
        { status: 400 }
      );
    }

    const label = body.label?.trim() || cleanName.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const description = body.description?.trim() || `Custom system role for ${label}`;
    const elevatedPrivilege = Boolean(body.elevatedPrivilege);
    const active = body.active !== false;

    // Duplicate check
    const existing = await db.sysUserRole.findUnique({
      where: { name: cleanName },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Role with identifier '${cleanName}' already exists` },
        { status: 409 }
      );
    }

    const newRole = await db.sysUserRole.create({
      data: {
        name: cleanName,
        label,
        description,
        elevatedPrivilege,
        active,
      },
    });

    return NextResponse.json({ result: newRole }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/now/roles error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
