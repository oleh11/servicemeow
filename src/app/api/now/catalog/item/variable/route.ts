import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/now/catalog/item/variable -> add or update a variable on a catalog item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, catalogItemId, name, label, varType = "string", isMandatory = false, optionsJson, order = 1 } = body;

    if (!catalogItemId) {
      return NextResponse.json({ error: "catalogItemId is required" }, { status: 400 });
    }

    if (!name || !label) {
      return NextResponse.json({ error: "name and label are required" }, { status: 400 });
    }

    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const formattedOptions = optionsJson
      ? typeof optionsJson === "string"
        ? optionsJson
        : JSON.stringify(optionsJson)
      : null;

    if (id) {
      // Update existing variable
      const updated = await db.catalogVariable.update({
        where: { id },
        data: {
          name: cleanName,
          label,
          varType,
          isMandatory: Boolean(isMandatory),
          optionsJson: formattedOptions,
          order: Number(order) || 1,
        },
      });
      return NextResponse.json({ result: updated });
    }

    // Create new variable
    const created = await db.catalogVariable.create({
      data: {
        catalogItemId,
        name: cleanName,
        label,
        varType,
        isMandatory: Boolean(isMandatory),
        optionsJson: formattedOptions,
        order: Number(order) || 1,
      },
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/now/catalog/item/variable?id=...
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Variable id is required" }, { status: 400 });
    }

    await db.catalogVariable.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/now/catalog/item/variable -> reorder variables
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { catalogItemId, orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "orders array is required" }, { status: 400 });
    }

    for (const item of orders) {
      if (item.id && typeof item.order === "number") {
        await db.catalogVariable.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }
    }

    const updated = await db.catalogVariable.findMany({
      where: { catalogItemId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

