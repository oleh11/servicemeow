import { db } from "./db";

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

  // Sandbox runner
  // Script includes are typically written as:
  // var IncidentUtils = Class.create();
  // IncidentUtils.prototype = { initialize: function() {}, myMethod: function(arg) { return ...; } };
  // or standard ES6 class:
  // class IncidentUtils { myMethod(arg) { return ...; } }
  const wrapperCode = `
    const Class = {
      create: function() {
        return function() {
          if (this.initialize) this.initialize.apply(this, arguments);
        };
      }
    };
    const gs = {
      log: (msg) => console.log("[gs.log]", msg),
      error: (msg) => console.error("[gs.error]", msg),
      getUserID: () => context.userId || "admin",
      getUserName: () => context.userName || "System Administrator",
      nowDateTime: () => new Date().toISOString(),
    };

    ${scriptInclude.script}

    if (typeof ${scriptInclude.name} !== "undefined") {
      const Instance = typeof ${scriptInclude.name} === "function" ? new ${scriptInclude.name}() : ${scriptInclude.name};
      if ("${methodName || ""}" && typeof Instance["${methodName || ""}"] === "function") {
        return Instance["${methodName || ""}"](...args);
      }
      return Instance;
    }
    return null;
  `;

  try {
    const fn = new Function("args", "context", wrapperCode);
    return fn(args, context);
  } catch (err: any) {
    throw new Error(`Script Include '${scriptInclude.name}' execution failed: ${err.message}`);
  }
}
