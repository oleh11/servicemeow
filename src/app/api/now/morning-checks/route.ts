import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shift = searchParams.get("shift");
    const category = searchParams.get("category");
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    const where: any = {};
    if (shift && shift.toLowerCase() !== "all") {
      where.shift = { in: [shift, shift.toLowerCase(), shift.toUpperCase()] };
    }
    if (category && category.toLowerCase() !== "all") {
      where.category = { in: [category, category.toLowerCase(), category.toUpperCase()] };
    }

    if (dateParam) {
      const parts = dateParam.split("-").map(Number);
      if (parts.length === 3) {
        const start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
        const end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999));
        where.createdAt = { gte: start, lte: end };
      }
    }

    const checks = await db.cmnMorningCheck.findMany({
      where,
      include: {
        checkedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }, { category: "asc" }],
      take: 100,
    });

    const formatted = checks.map((c) => ({
      ...c,
      status: c.status.toUpperCase(),
      category: c.category.toUpperCase(),
      shift: c.shift.toUpperCase(),
    }));

    return NextResponse.json({ result: formatted, checks: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch morning checks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !body.category) {
      return NextResponse.json(
        { error: "title and category are required" },
        { status: 400 }
      );
    }

    const targetSystem =
      body.target_system || body.targetSystem || body.title || "Core-Infrastructure";
    const shift = (body.shift || "morning").toLowerCase();
    const status = (body.status || "pending").toLowerCase();
    const notes = body.notes || null;

    const check = await db.cmnMorningCheck.create({
      data: {
        title: body.title,
        category: body.category.toLowerCase(),
        targetSystem,
        shift,
        status,
        notes,
        checkedById: session.user.id,
        checkedAt: status !== "pending" ? new Date() : null,
      },
      include: {
        checkedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted = {
      ...check,
      status: check.status.toUpperCase(),
      category: check.category.toUpperCase(),
      shift: check.shift.toUpperCase(),
    };

    return NextResponse.json({ result: formatted, check: formatted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create morning check" },
      { status: 500 }
    );
  }
}
