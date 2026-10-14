import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { runInSecureSandbox } from "@/lib/script-sandbox";

async function handleScriptedRest(
  request: NextRequest,
  params: Promise<{ slug: string[] }>,
  method: string
) {
  try {
    // 1. Session verification
    const session = await requireAuth(request);

    const { slug } = await params;
    const pathJoined = slug.join("/");

    // 2. Find active API definitions
    const definitions = await db.sysWsDefinition.findMany({
      where: { active: true },
      include: { operations: true },
    });

    // 3. Match definition by basePath prefix
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

    const safeResponse = {
      status: 200,
      headers: {} as Record<string, string>,
    };

    const sandboxContext = {
      request: {
        method,
        path: pathJoined,
        queryParams,
        body: requestBody,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
      },
      response: safeResponse,
      gs: {
        log: (...args: any[]) => console.log(`[ScriptedRest ${matchedDef.name}]`, ...args),
        nowDateTime: () => new Date().toISOString(),
      },
    };

    let resultOutput: any = null;
    try {
      const codeToRun = `
        const request = sandboxContext.request;
        const response = sandboxContext.response;
        const gs = sandboxContext.gs;
        ${matchedOp.script}
      `;
      resultOutput = await runInSecureSandbox(
        codeToRun,
        { sandboxContext },
        { timeoutMs: 3000 }
      );
    } catch (scriptErr: any) {
      return NextResponse.json(
        { error: `Script execution error in ${matchedDef.name}: ${scriptErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { result: resultOutput ?? { success: true } },
      { status: safeResponse.status || 200 }
    );
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
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
