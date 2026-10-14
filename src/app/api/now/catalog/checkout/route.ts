import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getNextNumber } from "@/lib/numbering";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { catalog_item_id, user_id, variables } = body;

    const catalogItem = await db.catalogItem.findUnique({
      where: { id: catalog_item_id },
    });

    if (!catalogItem) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    // 1. Create REQ
    const reqNumber = await getNextNumber("REQ");
    const reqTask = await db.task.create({
      data: {
        number: reqNumber,
        sysClassName: "sc_request",
        shortDescription: `Request for: ${catalogItem.name}`,
        priority: 4,
        state: 1, // New
        openedById: user_id || null,
      },
    });

    const serviceRequest = await db.request.create({
      data: {
        taskId: reqTask.id,
        requestedFor: user_id || "Employee",
        totalPrice: catalogItem.price,
      },
    });

    // 2. Create RITM
    const ritmNumber = await getNextNumber("RITM");
    const ritmTask = await db.task.create({
      data: {
        number: ritmNumber,
        sysClassName: "sc_req_item",
        shortDescription: catalogItem.name,
        description: `Requested specifications: ${JSON.stringify(variables, null, 2)}`,
        priority: 4,
        state: 1, // New
        openedById: user_id || null,
      },
    });

    const ritm = await db.requestedItem.create({
      data: {
        taskId: ritmTask.id,
        requestId: serviceRequest.id,
        catalogItemId: catalogItem.id,
        variablesJson: JSON.stringify(variables),
        stage: "fulfillment",
      },
    });

    // 3. Create SCTASK for fulfillment team
    const scTaskNumber = await getNextNumber("TASK");
    const scTaskRecord = await db.task.create({
      data: {
        number: scTaskNumber,
        sysClassName: "sc_task",
        shortDescription: `Fulfill order: ${catalogItem.name} for ${ritmNumber}`,
        description: `Fulfillment instructions: Deliver item according to options: ${JSON.stringify(variables)}`,
        priority: 4,
        state: 1,
      },
    });

    await db.catalogTask.create({
      data: {
        taskId: scTaskRecord.id,
        ritmId: ritm.id,
      },
    });

    return NextResponse.json(
      {
        result: {
          request_number: reqNumber,
          ritm_number: ritmNumber,
          task_number: scTaskNumber,
          ritm_id: ritmTask.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Catalog checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
