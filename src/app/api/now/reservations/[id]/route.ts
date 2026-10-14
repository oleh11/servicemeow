import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await db.cmnReservation.findUnique({
      where: { id },
      include: {
        space: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    campus: true,
                  },
                },
              },
            },
          },
        },
        reservedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json({ result: reservation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reservation" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.cmnReservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const targetSpaceId = body.spaceId || body.space_id || existing.spaceId;
    const targetStartTime = body.startTime || body.start_time ? new Date(body.startTime || body.start_time) : existing.startTime;
    const targetEndTime = body.endTime || body.end_time ? new Date(body.endTime || body.end_time) : existing.endTime;
    const targetStatus = body.status !== undefined ? body.status : existing.status;

    if (targetEndTime <= targetStartTime) {
      return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
    }

    // Check conflict if active
    if (targetStatus !== "cancelled") {
      const conflict = await db.cmnReservation.findFirst({
        where: {
          id: { not: id },
          spaceId: targetSpaceId,
          status: { not: "cancelled" },
          startTime: { lt: targetEndTime },
          endTime: { gt: targetStartTime },
        },
        include: {
          reservedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error: "Reservation conflict: Space is already booked during this time interval.",
            conflictWith: {
              id: conflict.id,
              number: conflict.number,
              subject: conflict.subject,
              startTime: conflict.startTime,
              endTime: conflict.endTime,
              reservedBy: conflict.reservedBy?.name || "Another User",
            },
          },
          { status: 409 }
        );
      }
    }

    let capabilitiesNeededStr: string | undefined = undefined;
    if (body.capabilitiesNeeded !== undefined || body.capabilities_needed !== undefined) {
      const raw = body.capabilitiesNeeded !== undefined ? body.capabilitiesNeeded : body.capabilities_needed;
      capabilitiesNeededStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    }

    const updated = await db.cmnReservation.update({
      where: { id },
      data: {
        spaceId: body.spaceId || body.space_id ? targetSpaceId : undefined,
        reservedById: body.reservedById || body.reserved_by_id ? (body.reservedById || body.reserved_by_id) : undefined,
        subject: body.subject !== undefined ? body.subject : undefined,
        startTime: (body.startTime || body.start_time) ? targetStartTime : undefined,
        endTime: (body.endTime || body.end_time) ? targetEndTime : undefined,
        status: targetStatus,
        attendeesCount: body.attendeesCount !== undefined ? parseInt(body.attendeesCount, 10) : (body.attendees_count !== undefined ? parseInt(body.attendees_count, 10) : undefined),
        capabilitiesNeeded: capabilitiesNeededStr,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
      include: {
        space: {
          include: {
            floor: {
              include: { building: true },
            },
          },
        },
        reservedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update reservation" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.cmnReservation.delete({ where: { id } });
    return NextResponse.json({ result: { status: "deleted", id } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete reservation" }, { status: 500 });
  }
}
