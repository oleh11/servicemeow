/**
 * Sandboxed JavaScript execution engine.
 *
 * User-authored scripts (scheduled jobs, script includes, scripted REST,
 * record producers) run inside QuickJS compiled to WebAssembly. The guest
 * is a separate JS engine with its own heap and no access to Node: there is
 * no shared `Object`/`Function` realm, so constructor-chain escapes such as
 * `Object.constructor('return process')()` only reach QuickJS's own Function,
 * which cannot touch the host.
 *
 * Host <-> guest boundary:
 *  - Plain data in the context is copied in as JSON.
 *  - Functions in the context (at any depth) become guest stubs that call the
 *    host with JSON-serialized arguments/results. Host objects and functions
 *    are never handed to the guest directly.
 *  - After the script finishes, top-level object/array values in the context
 *    are copied back into the caller's objects, so scripts can still mutate
 *    `current`, `response`, etc.
 *
 * Limits: wall-clock deadline (interrupt handler), heap limit, stack limit.
 */
import { getQuickJS, shouldInterruptAfterDeadline, type QuickJSWASMModule } from "quickjs-emscripten";

export interface SandboxOptions {
  timeoutMs?: number;
  memoryLimitBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_MEMORY_LIMIT = 32 * 1024 * 1024; // 32 MB guest heap
const MAX_STACK_BYTES = 512 * 1024;

let modulePromise: Promise<QuickJSWASMModule> | null = null;
function loadQuickJS(): Promise<QuickJSWASMModule> {
  if (!modulePromise) modulePromise = getQuickJS();
  return modulePromise;
}

type HostFn = (...args: any[]) => any;

/** Replace functions with path markers so the context can cross as JSON. */
function describeContext(value: any, path: string, fns: Map<string, HostFn>, seen: WeakSet<object>): any {
  if (typeof value === "function") {
    fns.set(path, value);
    return { __sandbox_fn__: path };
  }
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) throw new Error(`Sandbox context contains a circular reference at '${path}'`);
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((v, i) => describeContext(v, `${path}[${i}]`, fns, seen));
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = describeContext(v, path ? `${path}.${k}` : k, fns, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

function safeStringify(value: any): string | undefined {
  if (value === undefined) return undefined;
  return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Merge mutated guest data back into a host object, preserving host functions. */
function mergeInto(target: Record<string, any>, src: Record<string, any>) {
  for (const k of Object.keys(target)) {
    if (typeof target[k] !== "function" && !(k in src)) delete target[k];
  }
  for (const [k, v] of Object.entries(src)) {
    const t = target[k];
    if (typeof t === "function") continue; // never overwrite host functions
    if (isPlainObject(t) && isPlainObject(v)) mergeInto(t, v);
    else if (Array.isArray(t) && Array.isArray(v)) t.splice(0, t.length, ...v);
    else target[k] = v;
  }
}

function copyBack(original: Record<string, any>, snapshot: Record<string, any>) {
  for (const [key, newVal] of Object.entries(snapshot)) {
    const target = original[key];
    if (Array.isArray(target) && Array.isArray(newVal)) target.splice(0, target.length, ...newVal);
    else if (isPlainObject(target) && isPlainObject(newVal)) mergeInto(target, newVal);
  }
}

// Guest-side bootstrap: rebuild the context, turning fn markers into stubs.
const BOOTSTRAP = `
(function (ctxJson) {
  const hostCall = globalThis.__hostCall;
  delete globalThis.__hostCall;
  function revive(v) {
    if (v && typeof v === "object") {
      if (typeof v.__sandbox_fn__ === "string") {
        const path = v.__sandbox_fn__;
        return function () {
          const r = hostCall(path, JSON.stringify(Array.prototype.slice.call(arguments)));
          return r === undefined ? undefined : JSON.parse(r);
        };
      }
      if (Array.isArray(v)) return v.map(revive);
      const o = {};
      for (const k of Object.keys(v)) o[k] = revive(v[k]);
      return o;
    }
    return v;
  }
  const ctx = revive(JSON.parse(ctxJson));
  for (const k of Object.keys(ctx)) globalThis[k] = ctx[k];
  globalThis.__ctxKeys = Object.keys(ctx);
  const logFn = (level) => function () {
    hostCall("__console." + level, JSON.stringify(Array.prototype.slice.call(arguments).map(String)));
  };
  globalThis.console = { log: logFn("log"), warn: logFn("warn"), error: logFn("error"), info: logFn("log") };
})
`;

/**
 * Run untrusted JavaScript in an isolated QuickJS runtime.
 * `code` is a function body: use `return` to produce a result.
 * Results must be JSON-serializable (functions are dropped).
 * Host functions in the context must be synchronous.
 */
export async function runInSecureSandbox<T = any>(
  code: string,
  injectedContext: Record<string, any> = {},
  options: SandboxOptions = {}
): Promise<T> {
  const QuickJS = await loadQuickJS();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const hostFns = new Map<string, HostFn>();
  hostFns.set("__console.log", (...a) => console.log("[Sandbox Log]", ...a));
  hostFns.set("__console.warn", (...a) => console.warn("[Sandbox Warn]", ...a));
  hostFns.set("__console.error", (...a) => console.error("[Sandbox Error]", ...a));
  const described = describeContext(injectedContext, "", hostFns, new WeakSet());

  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(options.memoryLimitBytes ?? DEFAULT_MEMORY_LIMIT);
  runtime.setMaxStackSize(MAX_STACK_BYTES);
  const deadline = Date.now() + timeoutMs;
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(deadline));
  const vm = runtime.newContext();

  try {
    // Single host entry point: (path, argsJson) -> JSON string | undefined.
    const hostCall = vm.newFunction("__hostCall", (pathH, argsH) => {
      const path = vm.getString(pathH);
      const fn = hostFns.get(path);
      if (!fn) return { error: vm.newError(`Unknown host function '${path}'`) };
      let args: any[] = [];
      try {
        args = JSON.parse(vm.getString(argsH));
      } catch {
        args = [];
      }
      try {
        const result = fn(...args);
        if (result && typeof (result as any).then === "function") {
          return { error: vm.newError(`Host function '${path}' is async; async host calls are not supported`) };
        }
        const json = safeStringify(result);
        return json === undefined ? vm.undefined : vm.newString(json);
      } catch (e: any) {
        return { error: vm.newError(String(e?.message ?? e)) };
      }
    });
    vm.setProp(vm.global, "__hostCall", hostCall);
    hostCall.dispose();

    const boot = vm.unwrapResult(vm.evalCode(BOOTSTRAP, "sandbox-bootstrap.js"));
    const ctxStr = vm.newString(JSON.stringify(described));
    vm.unwrapResult(vm.callFunction(boot, vm.undefined, ctxStr)).dispose();
    ctxStr.dispose();
    boot.dispose();

    const wrapped = `
      (function () {
        const __result = (function () {
          "use strict";
          ${code}
        })();
        const __snap = {};
        for (const k of globalThis.__ctxKeys) {
          const v = globalThis[k];
          if (v && typeof v === "object") __snap[k] = v;
        }
        return JSON.stringify({ r: __result === undefined ? null : __result, u: __result === undefined, s: __snap });
      })()
    `;

    const evalResult = vm.evalCode(wrapped, "sandbox-execution.js");
    if (evalResult.error) {
      const err = vm.dump(evalResult.error);
      evalResult.error.dispose();
      const message = isPlainObject(err) ? String(err.message ?? JSON.stringify(err)) : String(err);
      if (Date.now() >= deadline || /interrupted/i.test(message)) {
        throw new Error(`Script execution timed out after ${timeoutMs}ms`);
      }
      throw new Error(message);
    }

    const out = JSON.parse(vm.getString(evalResult.value));
    evalResult.value.dispose();
    copyBack(injectedContext, out.s ?? {});
    return (out.u ? undefined : out.r) as T;
  } finally {
    vm.dispose();
    runtime.dispose();
  }
}
