import { describe, it, expect } from "vitest";
import { runInSecureSandbox } from "../src/lib/script-sandbox";

describe("Secure Sandboxed Script Runner", () => {
  it("should evaluate safe mathematical and string operations", () => {
    const result = runInSecureSandbox("return 40 + 2;");
    expect(result).toBe(42);

    const strResult = runInSecureSandbox("return 'Hello ' + 'ServiceMeow';");
    expect(strResult).toBe("Hello ServiceMeow");
  });

  it("should support injected safe context variables", () => {
    const context = {
      record: { priority: 1, shortDescription: "P1 Outage" },
      multiplier: 10,
    };
    const result = runInSecureSandbox(
      "return record.shortDescription + ' (Severity: ' + (record.priority * multiplier) + ')';",
      context
    );
    expect(result).toBe("P1 Outage (Severity: 10)");
  });

  it("should block access to host process and environment", () => {
    // Attempting to access process or process.exit
    expect(() => {
      runInSecureSandbox("return process.exit(1);");
    }).toThrow();

    expect(() => {
      runInSecureSandbox("return process.env.DATABASE_URL;");
    }).toThrow();
  });

  it("should block access to require and filesystem modules", () => {
    expect(() => {
      runInSecureSandbox("const fs = require('fs'); return fs.readdirSync('.');");
    }).toThrow();
  });

  it("should block constructor escaping to root Function", () => {
    expect(() => {
      runInSecureSandbox("return ({}).constructor.constructor('return process')();");
    }).toThrow();
  });

  it("should enforce execution timeout on infinite loops", () => {
    expect(() => {
      runInSecureSandbox("while (true) {}", {}, { timeoutMs: 100 });
    }).toThrow(/timed out/i);
  });
});
