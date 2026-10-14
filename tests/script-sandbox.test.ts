import { describe, it, expect } from "vitest";
import { runInSecureSandbox } from "../src/lib/script-sandbox";

describe("Secure Sandboxed Script Runner (QuickJS/WASM)", () => {
  it("evaluates safe arithmetic and string operations", async () => {
    expect(await runInSecureSandbox("return 40 + 2;")).toBe(42);
    expect(await runInSecureSandbox("return 'Hello ' + 'ServiceMeow';")).toBe("Hello ServiceMeow");
  });

  it("supports injected data context", async () => {
    const result = await runInSecureSandbox(
      "return record.shortDescription + ' (Severity: ' + (record.priority * multiplier) + ')';",
      { record: { priority: 1, shortDescription: "P1 Outage" }, multiplier: 10 }
    );
    expect(result).toBe("P1 Outage (Severity: 10)");
  });

  it("calls synchronous host callbacks with JSON args and results", async () => {
    const logs: string[] = [];
    const result = await runInSecureSandbox(
      "log('hello', 42); gs.log('via gs'); return gs.nowDateTime().length > 0;",
      {
        log: (...m: any[]) => logs.push(m.join(" ")),
        gs: { log: (m: any) => logs.push(String(m)), nowDateTime: () => new Date().toISOString() },
      }
    );
    expect(result).toBe(true);
    expect(logs).toEqual(["hello 42", "via gs"]);
  });

  it("copies mutations of context objects back to the caller", async () => {
    const current: Record<string, any> = { short_description: "", priority: 3 };
    const response = { status: 200, headers: {} as Record<string, string> };
    await runInSecureSandbox(
      "current.short_description = 'From producer'; current.priority = 1; response.status = 201; response.headers['x-a'] = 'b';",
      { current, response }
    );
    expect(current).toEqual({ short_description: "From producer", priority: 1 });
    expect(response.status).toBe(201);
    expect(response.headers).toEqual({ "x-a": "b" });
  });

  it("returns undefined when the script returns nothing", async () => {
    expect(await runInSecureSandbox("const x = 1;")).toBeUndefined();
  });

  it("has no process / require / module", async () => {
    expect(await runInSecureSandbox("return typeof process + ',' + typeof require + ',' + typeof module;")).toBe(
      "undefined,undefined,undefined"
    );
    await expect(runInSecureSandbox("return process.env.DATABASE_URL;")).rejects.toThrow();
    await expect(runInSecureSandbox("const fs = require('fs'); return fs.readdirSync('.');")).rejects.toThrow();
  });

  // These payloads all escaped the previous node:vm sandbox (verified) — they must not reach Node now.
  const escapePayloads: Record<string, string> = {
    "split-string constructor chain on Object":
      "const c='constr'+'uctor'; return Object[c][c]('return typeof process')();",
    "constructor chain on injected host function":
      "const c='constr'+'uctor'; return log[c]('return typeof process')();",
    "classic ({}).constructor.constructor":
      "return ({}).constructor.constructor('return typeof process')();",
    "Function via arrow prototype":
      "return (()=>{}).constructor('return typeof globalThis.process')();",
    "error stack prepareStackTrace trick":
      "Error.prepareStackTrace = (e, s) => s; try { null.x } catch (e) { return typeof e.stack; } ",
  };

  for (const [name, payload] of Object.entries(escapePayloads)) {
    it(`blocks sandbox escape: ${name}`, async () => {
      let result: any;
      try {
        result = await runInSecureSandbox(payload, { log: () => {} });
      } catch {
        return; // throwing is also acceptable
      }
      // If it runs, it must only ever see the guest realm — never Node's process.
      expect(result).not.toBe("object");
      expect(String(result)).not.toMatch(/v\d+\.\d+|win32|linux|darwin/);
    });
  }

  it("cannot reach host process via a host callback's return value", async () => {
    const result = await runInSecureSandbox(
      "const v = leak(); return typeof v + ':' + JSON.stringify(v);",
      { leak: () => ({ fn: () => process, proc: process.platform }) }
    );
    // Functions are dropped at the boundary; only JSON data crosses.
    expect(result).toBe(`object:${JSON.stringify({ proc: process.platform })}`);
  });

  it("enforces the execution timeout on infinite loops", async () => {
    await expect(runInSecureSandbox("while (true) {}", {}, { timeoutMs: 100 })).rejects.toThrow(/timed out/i);
  });

  it(
    "enforces the memory limit",
    async () => {
      await expect(
        runInSecureSandbox("const a = []; while (true) a.push('x'.repeat(2e5));", {}, {
          timeoutMs: 5000,
          memoryLimitBytes: 2 * 1024 * 1024,
        })
      ).rejects.toThrow();
    },
    10000
  );

  it("rejects async host functions instead of leaking a Promise", async () => {
    await expect(runInSecureSandbox("return f();", { f: async () => 1 })).rejects.toThrow(/async/);
  });
});
