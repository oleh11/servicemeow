import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/now/catalog/item -> list all or single item by ?id=
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      const items = await db.catalogItem.findMany({
        include: { variables: { orderBy: { order: "asc" } } },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return NextResponse.json({ result: items });
    }

    const item = await db.catalogItem.findUnique({
      where: { id },
      include: { variables: { orderBy: { order: "asc" } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    return NextResponse.json({ result: item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/now/catalog/item -> create a new catalog item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      shortDescription,
      description,
      category = "Hardware",
      price = 0,
      icon = "Box",
      deliveryDays = 2,
      active = true,
      variables = [],
    } = body;

    if (!name || !shortDescription) {
      return NextResponse.json(
        { error: "name and shortDescription are required fields." },
        { status: 400 }
      );
    }

    const newItem = await db.catalogItem.create({
      data: {
        name,
        shortDescription,
        description: description || null,
        category,
        price: Number(price) || 0,
        icon: icon || "Box",
        deliveryDays: Number(deliveryDays) || 2,
        active: Boolean(active),
        variables: {
          create: Array.isArray(variables)
            ? variables.map((v: any, idx: number) => ({
                name: (v.name || `var_${idx}`).toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                label: v.label || v.name || "Option",
                varType: v.varType || "string",
                isMandatory: Boolean(v.isMandatory),
                optionsJson: v.optionsJson
                  ? typeof v.optionsJson === "string"
                    ? v.optionsJson
                    : JSON.stringify(v.optionsJson)
                  : null,
                order: Number(v.order) || idx + 1,
              }))
            : [],
        },
      },
      include: { variables: true },
    });

    return NextResponse.json({ result: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/now/catalog/item -> update existing item by { id, ...fields }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, shortDescription, description, category, price, icon, deliveryDays, active } = body;

    if (!id) {
      return NextResponse.json({ error: "Item id is required for update." }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (icon !== undefined) updateData.icon = icon;
    if (deliveryDays !== undefined) updateData.deliveryDays = Number(deliveryDays);
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await db.catalogItem.update({
      where: { id },
      data: updateData,
      include: { variables: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/now/catalog/item?id=...
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Item id is required for deletion." }, { status: 400 });
    }

    await db.catalogVariable.deleteMany({ where: { catalogItemId: id } });
    await db.catalogItem.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
