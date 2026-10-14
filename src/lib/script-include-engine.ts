import { db } from "./db";
import { runInSecureSandbox } from "./script-sandbox";

export async function executeScriptInclude(
  nameOrApiName: string,
  methodName?: string,
  args: any[] = [],
  context: Record<string, any> = {}
): Promise<any> {
  const scriptInclude = await db.sysScriptInclude.findFirst({
    where: {
      OR: [
        { name: nameOrApiName },
        { apiName: nameOrApiName },
      ],
      active: true,
    },
  });

  if (!scriptInclude) {
    throw new Error(`Script Include '${nameOrApiName}' was not found or is inactive.`);
  }

  // 1. Validate methodName identifier strictly to prevent code injection
  if (methodName && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(methodName)) {
    throw new Error(`Invalid method name: '${methodName}'. Method names must be valid JavaScript identifiers.`);
  }

  // The include's name is interpolated into the wrapper below, so it must be a plain identifier.
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(scriptInclude.name)) {
    throw new Error(`Script Include name '${scriptInclude.name}' is not a valid JavaScript identifier.`);
  }

  // 2. Build sandbox context (data + synchronous host callbacks only; `Class` is defined guest-side)
  const gs = {
    log: (msg: any) => console.log("[gs.log]", msg),
    warn: (msg: any) => console.warn("[gs.warn]", msg),
    error: (msg: any) => console.error("[gs.error]", msg),
    getUserID: () => context.userId || "admin",
    getUserName: () => context.userName || "System Administrator",
    nowDateTime: () => new Date().toISOString(),
  };

  const sandboxContext = {
    gs,
    args,
    context,
    targetMethod: methodName || null,
  };

  // Safe wrapper code that inspects targetMethod passed via context without string concatenation!
  const wrappedCode = `
    const Class = {
      create: function () {
        return function () {
          if (this.initialize) this.initialize.apply(this, arguments);
        };
      },
    };

    ${scriptInclude.script}

    if (typeof ${scriptInclude.name} !== "undefined") {
      const Instance = typeof ${scriptInclude.name} === "function" ? new ${scriptInclude.name}() : ${scriptInclude.name};
      if (targetMethod && typeof Instance[targetMethod] === "function") {
        return Instance[targetMethod](...args);
      }
      return Instance;
    }
    return null;
  `;

  try {
    return await runInSecureSandbox(wrappedCode, sandboxContext, { timeoutMs: 3000 });
  } catch (err: any) {
    throw new Error(`Script Include '${scriptInclude.name}' execution failed: ${err.message}`);
  }
}
