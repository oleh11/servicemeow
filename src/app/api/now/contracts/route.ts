import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/contracts -> returns all contracts with days remaining
export async function GET(request: NextRequest) {
  try {
    const contracts = await db.astContract.findMany({
      orderBy: { endDate: "asc" },
    });

    const now = new Date();
    const enriched = contracts.map((c) => {
      const end = new Date(c.endDate);
      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let computedStatus = c.status;
      if (daysRemaining < 0) {
        computedStatus = "expired";
      } else if (daysRemaining <= 30) {
        computedStatus = "expiring_soon";
      }

      return {
        ...c,
        daysRemaining,
        computedStatus,
      };
    });

    return NextResponse.json({ result: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/contracts -> create contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractNumber,
      name,
      vendor,
      contractType = "service",
      cost = 0,
      startDate,
      endDate,
      status = "active",
      terms,
    } = body;

    if (!contractNumber || !name || !vendor || !endDate) {
      return NextResponse.json(
        { error: "contractNumber, name, vendor, and endDate are required" },
        { status: 400 }
      );
    }

    const created = await db.astContract.create({
      data: {
        contractNumber,
        name,
        vendor,
        contractType,
        cost: Number(cost) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        status,
        terms: terms || null,
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/now/contracts -> update contract
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, vendor, contractType, cost, startDate, endDate, status, terms } = body;

    if (!id) {
      return NextResponse.json({ error: "Contract id is required" }, { status: 400 });
    }

    const updated = await db.astContract.update({
      where: { id },
      data: {
        name: name || undefined,
        vendor: vendor || undefined,
        contractType: contractType || undefined,
        cost: cost !== undefined ? Number(cost) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined,
        terms: terms !== undefined ? terms : undefined,
      },
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/now/contracts?id=...
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Contract id is required" }, { status: 400 });
    }

    await db.astContract.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
