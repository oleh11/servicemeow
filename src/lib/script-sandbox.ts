/**
 * Secure Sandboxed JavaScript Execution Engine
 * Uses Node.js vm with isolated context, instruction timeout,
 * and explicit restriction of process, require, global, and dangerous constructor escapes.
 */
import vm from "node:vm";

export interface SandboxOptions {
  timeoutMs?: number;
  context?: Record<string, any>;
}

/**
 * Runs JavaScript code in a restricted, isolated sandbox environment.
 * Prevents access to host environment, filesystem, network, and process APIs.
 */
export function runInSecureSandbox<T = any>(
  code: string,
  injectedContext: Record<string, any> = {},
  options: SandboxOptions = {}
): T {
  const timeout = options.timeoutMs || 3000;

  // 1. Static security analysis to detect constructor escape attacks
  if (
    /constructor\s*\[\s*['"`]constructor['"`]\s*\]/i.test(code) ||
    /constructor\s*\.\s*constructor/i.test(code) ||
    /__proto__/i.test(code)
  ) {
    throw new Error("Security Error: Forbidden constructor or prototype escape pattern detected.");
  }

  // 2. Construct safe sandbox with clean standard objects
  const sandbox: Record<string, any> = {
    Date,
    Math,
    JSON,
    RegExp,
    Array,
    Object,
    String,
    Number,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    decodeURI,
    encodeURIComponent,
    decodeURIComponent,

    console: {
      log: (...args: any[]) => console.log("[Sandbox Log]", ...args),
      warn: (...args: any[]) => console.warn("[Sandbox Warn]", ...args),
      error: (...args: any[]) => console.error("[Sandbox Error]", ...args),
    },

    ...injectedContext,
  };

  // 3. Explicitly block process, require, and environment APIs
  Object.defineProperty(sandbox, "process", {
    value: undefined,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(sandbox, "require", {
    value: undefined,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(sandbox, "global", {
    value: undefined,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(sandbox, "globalThis", {
    value: sandbox,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(sandbox, "module", {
    value: undefined,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(sandbox, "Function", {
    value: undefined,
    writable: false,
    configurable: false,
  });

  const context = vm.createContext(sandbox);

  const wrappedCode = `
    "use strict";
    (function() {
      return (function() {
        ${code}
      })();
    })();
  `;

  const script = new vm.Script(wrappedCode, {
    filename: "sandbox-execution.js",
  });

  try {
    return script.runInContext(context, {
      timeout,
      displayErrors: true,
    });
  } catch (err: any) {
    throw new Error(err.message || String(err));
  }
}
