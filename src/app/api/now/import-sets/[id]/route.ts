import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const importSet = await db.sysImportSet.findUnique({
      where: { id },
      include: {
        rows: { orderBy: { rowNumber: "asc" } },
        transformMaps: { include: { entries: true } },
      },
    });

    if (!importSet) {
      return NextResponse.json({ error: "Import set not found" }, { status: 404 });
    }

    return NextResponse.json({ result: importSet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
