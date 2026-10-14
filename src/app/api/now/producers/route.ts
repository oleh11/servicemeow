import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const producers = await db.sysRecordProducer.findMany({
      include: {
        variables: {
          orderBy: { order: "asc" },
        },
        uiPolicies: {
          include: { actions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ result: producers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      shortDescription,
      description,
      category,
      targetTable,
      producerScript,
      redirectUrl,
      icon,
      active,
      variables,
    } = body;

    if (!name || !shortDescription) {
      return NextResponse.json(
        { error: "Name and shortDescription are required." },
        { status: 400 }
      );
    }

    const producer = await db.sysRecordProducer.create({
      data: {
        name,
        shortDescription,
        description: description || null,
        category: category || "IT Services",
        targetTable: targetTable || "incident",
        producerScript: producerScript || null,
        redirectUrl: redirectUrl || null,
        icon: icon || "FileSpreadsheet",
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    if (variables && Array.isArray(variables)) {
      for (let i = 0; i < variables.length; i++) {
        const v = variables[i];
        await db.catalogVariable.create({
          data: {
            producerId: producer.id,
            name: v.name,
            label: v.label,
            varType: v.varType || "string",
            isMandatory: Boolean(v.isMandatory),
            optionsJson: v.optionsJson || null,
            order: v.order ?? i,
            mapToField: Boolean(v.mapToField),
            targetField: v.targetField || null,
          },
        });
      }
    }

    const fullProducer = await db.sysRecordProducer.findUnique({
      where: { id: producer.id },
      include: { variables: { orderBy: { order: "asc" } } },
    });

    const { recordUpdateChange } = await import("@/lib/update-set");
    await recordUpdateChange({
      type: "sc_cat_item_producer",
      action: "insert",
      recordId: producer.id,
      name: producer.name,
      data: fullProducer,
    });

    return NextResponse.json({ result: fullProducer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
