import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";
import { getServerSession } from "@/lib/auth";

// GET /api/now/navigation/applications -> returns all application menus and their modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const session = await getServerSession(request);
    const userRoles = session ? session.roles : ["public"];

    const where: any = { active: true };
    if (category) {
      where.category = category;
    }

    const applications = await db.sysAppApplication.findMany({
      where,
      include: {
        app: true,
        modules: {
          where: { active: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ result: applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/navigation/applications -> create new application menu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Administrator role required to create navigation menus" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, name, category = "Custom Applications", roles = "itil", order = 100, icon = "Layers", appId } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const appName = name || title.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const created = await db.sysAppApplication.create({
      data: {
        title,
        name: appName,
        category,
        roles,
        order: Number(order) || 100,
        icon,
        appId: appId || null,
        active: true,
      },
      include: { modules: true, app: true },
    });

    // Automatically capture change into the currently active Update Set!
    await recordUpdateChange({
      type: "sys_app_application",
      action: "insert",
      recordId: created.id,
      name: created.title,
      data: created,
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
