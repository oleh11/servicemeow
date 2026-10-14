import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

// GET /api/now/apps -> returns all custom applications
export async function GET() {
  try {
    const apps = await db.sysApp.findMany({
      include: {
        applicationMenus: {
          include: {
            modules: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ result: apps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/apps -> create new scoped application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, scope, version = "1.0.0", description, vendor = "ServiceMeow", icon = "Box" } = body;

    if (!name || !scope) {
      return NextResponse.json(
        { error: "name and scope are required to create an application" },
        { status: 400 }
      );
    }

    const cleanScope = scope.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const created = await db.sysApp.create({
      data: {
        name,
        scope: cleanScope,
        version,
        description: description || null,
        vendor,
        icon,
        active: true,
      },
      include: { applicationMenus: true },
    });

    // Automatically create a corresponding default Application Menu for navigation
    const defaultMenu = await db.sysAppApplication.create({
      data: {
        appId: created.id,
        title: created.name,
        name: cleanScope,
        category: "Custom Applications",
        roles: "itil",
        order: 200,
        icon: icon || "Layers",
        active: true,
      },
    });

    // Capture in currently active Update Set
    await recordUpdateChange({
      type: "sys_app",
      action: "insert",
      recordId: created.id,
      name: created.name,
      data: created,
    });

    await recordUpdateChange({
      type: "sys_app_application",
      action: "insert",
      recordId: defaultMenu.id,
      name: defaultMenu.title,
      data: defaultMenu,
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
