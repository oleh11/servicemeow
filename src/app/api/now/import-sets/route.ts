import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createImportSet } from "@/lib/import-set";

export async function GET() {
  try {
    const importSets = await db.sysImportSet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { rows: true } },
      },
      take: 50,
    });
    return NextResponse.json({ result: importSets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetTable, csvContent, name } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ error: "csvContent is required" }, { status: 400 });
    }

    const result = await createImportSet({
      targetTable: targetTable || "incident",
      csvContent,
      name,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
