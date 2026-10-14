import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordUpdateChange } from "@/lib/update-set";

// GET /api/now/navigation/modules -> returns modules, optionally filtered by applicationId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    const where: any = { active: true };
    if (applicationId) {
      where.applicationId = applicationId;
    }

    const modules = await db.sysAppModule.findMany({
      where,
      include: { application: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ result: modules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/navigation/modules -> create new navigation module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      title,
      order = 100,
      roles = "itil",
      linkType = "list",
      tableName,
      filterQuery,
      url,
      icon,
    } = body;

    if (!applicationId || !title) {
      return NextResponse.json(
        { error: "applicationId and title are required" },
        { status: 400 }
      );
    }

    const created = await db.sysAppModule.create({
      data: {
        applicationId,
        title,
        order: Number(order) || 100,
        roles,
        linkType,
        tableName: tableName || null,
        filterQuery: filterQuery || null,
        url: url || null,
        icon: icon || null,
        active: true,
      },
      include: { application: true },
    });

    // Capture in currently active Update Set
    await recordUpdateChange({
      type: "sys_app_module",
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
