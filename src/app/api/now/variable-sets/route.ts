import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const sets = await db.catalogVariableSet.findMany({
      include: {
        variables: { orderBy: { order: "asc" } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ result: sets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, variables = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const set = await db.catalogVariableSet.create({
      data: {
        name,
        description: description || null,
      },
    });

    if (Array.isArray(variables)) {
      for (let i = 0; i < variables.length; i++) {
        const v = variables[i];
        await db.catalogVariable.create({
          data: {
            variableSetId: set.id,
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

    const fullSet = await db.catalogVariableSet.findUnique({
      where: { id: set.id },
      include: { variables: true },
    });

    return NextResponse.json({ result: fullSet }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
