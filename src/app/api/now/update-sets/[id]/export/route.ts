import { NextRequest, NextResponse } from "next/server";
import { exportUpdateSet } from "@/lib/update-set";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "json") as "json" | "xml";

    const exported = await exportUpdateSet(id, format);

    return new NextResponse(exported.content, {
      status: 200,
      headers: {
        "Content-Type": format === "xml" ? "application/xml" : "application/json",
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
