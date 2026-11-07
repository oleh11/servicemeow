import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const roles = session.roles || (session.primaryRole ? [session.primaryRole] : []);
    const isAuthorized = session.isAdmin || roles.includes("workplace_admin") || roles.includes("itil");
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Workplace Administrator privileges required for spatial allocation" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const targetIds = Array.isArray(body.spaceIds) && body.spaceIds.length > 0
      ? body.spaceIds
      : Array.isArray(body.roomIds) && body.roomIds.length > 0
      ? body.roomIds
      : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "spaceIds or roomIds array is required and cannot be empty" }, { status: 400 });
    }

    const updateData: any = {};
    const targetType = body.spaceType || body.categoryCode;
    if (targetType) updateData.spaceType = targetType;
    if (body.department) updateData.department = body.department;
    if (body.status) updateData.status = body.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update fields provided (spaceType/categoryCode, department, status)" }, { status: 400 });
    }

    // Perform batch update
    const result = await db.cmnSpace.updateMany({
      where: {
        id: { in: targetIds },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      categoryCode: targetType,
      department: body.department,
      status: body.status,
      message: `Successfully allocated ${result.count} room(s) to ${targetType || body.department || body.status}`,
    });
  } catch (err: any) {
    console.error("Error in batch-allocate:", err);
    return NextResponse.json({ error: err.message || "Failed to execute batch allocation" }, { status: 500 });
  }
}
