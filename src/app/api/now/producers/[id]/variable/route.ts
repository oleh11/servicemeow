import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/producers/[id]/variable
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: producerId } = await params;
    const variables = await db.catalogVariable.findMany({
      where: { producerId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ result: variables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/producers/[id]/variable
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: producerId } = await params;
    const body = await request.json();
    const {
      id,
      name,
      label,
      varType = "string",
      isMandatory = false,
      optionsJson,
      order = 1,
      mapToField = false,
      targetField,
    } = body;

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
          mapToField: Boolean(mapToField),
          targetField: targetField || null,
        },
      });

      const { recordUpdateChange } = await import("@/lib/update-set");
      await recordUpdateChange({
        type: "item_option_new",
        action: "update",
        recordId: updated.id,
        name: updated.name,
        data: updated,
      });

      return NextResponse.json({ result: updated });
    }

    // Create new variable
    const created = await db.catalogVariable.create({
      data: {
        producerId,
        name: cleanName,
        label,
        varType,
        isMandatory: Boolean(isMandatory),
        optionsJson: formattedOptions,
        order: Number(order) || 1,
        mapToField: Boolean(mapToField),
        targetField: targetField || null,
      },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "item_option_new",
      action: "insert",
      recordId: created.id,
      name: created.name,
      data: created,
    });

    return NextResponse.json({ result: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/now/producers/[id]/variable?varId=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: producerId } = await params;
    const { searchParams } = new URL(request.url);
    const varId = searchParams.get("varId") || searchParams.get("id");

    if (!varId) {
      return NextResponse.json({ error: "Variable ID (varId) is required." }, { status: 400 });
    }

    await db.catalogVariable.delete({
      where: { id: varId },
    });

    return NextResponse.json({ success: true, deletedId: varId, producerId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/now/producers/[id]/variable -> reorder variables or batch update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: producerId } = await params;
    const body = await request.json();

    // Support array of variable orders: [{ id: "...", order: 1 }, ...]
    if (Array.isArray(body.orders)) {
      for (const item of body.orders) {
        if (item.id && typeof item.order === "number") {
          await db.catalogVariable.update({
            where: { id: item.id },
            data: { order: item.order },
          });
        }
      }
      const updatedList = await db.catalogVariable.findMany({
        where: { producerId },
        orderBy: { order: "asc" },
      });
      return NextResponse.json({ result: updatedList });
    }

    return NextResponse.json({ error: "orders array is required for batch PATCH" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
