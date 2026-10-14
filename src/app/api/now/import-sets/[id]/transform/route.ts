import { NextRequest, NextResponse } from "next/server";
import { executeTransform } from "@/lib/import-set";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { transformMapName, mappings } = body;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: "mappings array is required" }, { status: 400 });
    }

    const report = await executeTransform({
      importSetId: id,
      transformMapName,
      mappings,
    });

    return NextResponse.json({ result: report });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
