import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function handleScriptedRest(
  request: NextRequest,
  params: Promise<{ slug: string[] }>,
  method: string
) {
  try {
    const { slug } = await params;
    const pathJoined = slug.join("/");

    // Find all active API definitions
    const definitions = await db.sysWsDefinition.findMany({
      where: { active: true },
      include: { operations: true },
    });

    // Match definition by basePath prefix
    let matchedDef: any = null;
    let matchedOp: any = null;

    for (const def of definitions) {
      const cleanBase = def.basePath.replace(/^\/+|\/+$/g, "");
      if (pathJoined.startsWith(cleanBase)) {
        const remainingPath = pathJoined.slice(cleanBase.length).replace(/^\/+/, "") || "/";
        const op = def.operations.find(
          (o) =>
            o.httpMethod.toUpperCase() === method.toUpperCase() &&
            (o.uriTemplate === remainingPath ||
              o.uriTemplate === `/${remainingPath}` ||
              (o.uriTemplate === "/" && (remainingPath === "/" || !remainingPath)))
        );
        if (op) {
          matchedDef = def;
          matchedOp = op;
          break;
        }
      }
    }

    if (!matchedDef || !matchedOp) {
      return NextResponse.json(
        {
          error: `Scripted REST API endpoint not found: ${method} /api/custom/${pathJoined}`,
        },
        { status: 404 }
      );
    }

    let requestBody: any = null;
    if (method !== "GET") {
      try {
        requestBody = await request.json();
      } catch {
        requestBody = {};
      }
    }

    const queryParams: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const scriptContext = {
      request: {
        method,
        path: pathJoined,
        queryParams,
        body: requestBody,
        headers: Object.fromEntries(request.headers.entries()),
      },
      db,
      response: {
        status: 200,
        headers: {},
      },
    };

    let resultOutput: any = null;
    try {
      const sandboxFn = new Function("context", `
        const { request, response, db } = context;
        ${matchedOp.script}
      `);
      resultOutput = await sandboxFn(scriptContext);
    } catch (scriptErr: any) {
      return NextResponse.json(
        { error: `Script execution error in ${matchedDef.name}: ${scriptErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { result: resultOutput ?? { success: true } },
      { status: scriptContext.response.status || 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  return handleScriptedRest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  return handleScriptedRest(request, params, "POST");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  return handleScriptedRest(request, params, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  return handleScriptedRest(request, params, "DELETE");
}
