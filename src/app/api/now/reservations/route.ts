import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getNextNumber } from "@/lib/numbering";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "spaces";
    const startTimeParam = searchParams.get("startTime") || searchParams.get("start_time");
    const endTimeParam = searchParams.get("endTime") || searchParams.get("end_time");
    const capabilitiesParam = searchParams.get("capabilities"); // comma-separated e.g. "teams,zoom"
    const spaceType = searchParams.get("spaceType") || searchParams.get("space_type");
    const floorId = searchParams.get("floorId") || searchParams.get("floor_id");
    const buildingId = searchParams.get("buildingId") || searchParams.get("building_id");
    const minCapacity = searchParams.get("minCapacity") || searchParams.get("capacity");
    const search = searchParams.get("search")?.trim() || "";

    const startTime = startTimeParam ? new Date(startTimeParam) : null;
    const endTime = endTimeParam ? new Date(endTimeParam) : null;

    if (mode === "reservations") {
      const where: any = {};
      const spaceId = searchParams.get("spaceId") || searchParams.get("space_id");
      const status = searchParams.get("status");

      if (spaceId) where.spaceId = spaceId;
      if (status) where.status = status;
      if (startTime && endTime) {
        where.AND = [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ];
      } else if (startTime) {
        where.endTime = { gt: startTime };
      }

      const reservations = await db.cmnReservation.findMany({
        where,
        orderBy: { startTime: "asc" },
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

      return NextResponse.json({ result: reservations });
    }

    // Default: query spaces with availability and capabilities
    const spaceWhere: any = {};
    if (spaceType) {
      spaceWhere.spaceType = spaceType;
    }
    if (floorId) {
      spaceWhere.floorId = floorId;
    } else if (buildingId) {
      spaceWhere.floor = { buildingId };
    }
    if (minCapacity) {
      spaceWhere.capacity = { gte: parseInt(minCapacity, 10) };
    }
    if (search) {
      spaceWhere.OR = [
        { name: { contains: search } },
        { spaceNumber: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const spaces = await db.cmnSpace.findMany({
      where: spaceWhere,
      orderBy: [{ spaceNumber: "asc" }, { name: "asc" }],
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
        reservations: {
          where: {
            status: { not: "cancelled" },
            ...(startTime && endTime
              ? {
                  startTime: { lt: endTime },
                  endTime: { gt: startTime },
                }
              : {}),
          },
          include: {
            reservedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    // Required capabilities filter
    const requiredCaps = capabilitiesParam
      ? capabilitiesParam
          .split(",")
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const enrichedSpaces = spaces
      .map((sp) => {
        let caps: string[] = [];
        if (sp.capabilities) {
          try {
            caps = JSON.parse(sp.capabilities);
            if (!Array.isArray(caps)) caps = [];
          } catch {
            caps = sp.capabilities.split(",").map((s) => s.trim().toLowerCase());
          }
        }

        const isAvailable =
          sp.status !== "maintenance" &&
          sp.status !== "offline" &&
          (!startTime || !endTime || sp.reservations.length === 0);

        return {
          ...sp,
          parsedCapabilities: caps,
          isAvailable,
        };
      })
      .filter((sp) => {
        if (requiredCaps.length === 0) return true;
        const spaceCapSet = new Set(sp.parsedCapabilities.map((c: string) => c.toLowerCase()));
        return requiredCaps.every((req) => spaceCapSet.has(req));
      });

    return NextResponse.json({
      result: enrichedSpaces,
      total: enrichedSpaces.length,
      filters: {
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        capabilities: requiredCaps,
        spaceType,
        floorId,
        buildingId,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/now/reservations:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    const body = await request.json();

    const spaceId = body.space_id || body.spaceId;
    if (!spaceId) {
      return NextResponse.json({ error: "spaceId is required" }, { status: 400 });
    }

    const startTime = new Date(body.start_time || body.startTime);
    const endTime = new Date(body.end_time || body.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: "Invalid date format for startTime or endTime" }, { status: 400 });
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
    }

    // Verify space exists
    const space = await db.cmnSpace.findUnique({
      where: { id: spaceId },
      include: { floor: { include: { building: true } } },
    });

    if (!space) {
      return NextResponse.json({ error: "Selected space not found" }, { status: 404 });
    }

    // Double-booking conflict detection
    const conflict = await db.cmnReservation.findFirst({
      where: {
        spaceId,
        status: { not: "cancelled" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
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

    const resNumber = body.number || (await getNextNumber("cmn_reservation", "RES"));
    const reservedById = body.reserved_by_id || body.reservedById || session?.user?.id || null;

    let capabilitiesNeededStr: string | null = null;
    if (body.capabilitiesNeeded || body.capabilities_needed || body.capabilities) {
      const raw = body.capabilitiesNeeded || body.capabilities_needed || body.capabilities;
      capabilitiesNeededStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    }

    const reservation = await db.cmnReservation.create({
      data: {
        number: resNumber,
        spaceId,
        reservedById,
        subject: body.subject || `Booking for ${space.name}`,
        startTime,
        endTime,
        status: body.status || "confirmed",
        attendeesCount: body.attendees_count ? parseInt(body.attendees_count, 10) : (body.attendeesCount ? parseInt(body.attendeesCount, 10) : 1),
        capabilitiesNeeded: capabilitiesNeededStr,
        notes: body.notes || null,
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

    return NextResponse.json({ result: reservation }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/now/reservations:", error);
    return NextResponse.json({ error: error.message || "Failed to create reservation" }, { status: 500 });
  }
}
